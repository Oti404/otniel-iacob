import { Router, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '@monorepo/database';

const router = Router();

const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO = 'https://www.googleapis.com/oauth2/v2/userinfo';

const isConfigured = () =>
  !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL);

const frontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:4200';

// GET /api/auth/google — redirect to Google consent screen
router.get('/google', (req: Request, res: Response) => {
  if (!isConfigured()) {
    res.status(503).json({ message: 'Google OAuth not configured' });
    return;
  }
  // CSRF defense: bind this login attempt to a random nonce stored in a
  // short-lived cookie, then require Google to echo it back in the callback.
  // sameSite must be 'lax' (not 'strict') so the cookie survives the
  // top-level redirect back from accounts.google.com.
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: req.secure,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
  });
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL!,
    response_type: 'code',
    scope: 'openid email profile',
    state,
  });
  res.redirect(`${GOOGLE_AUTH}?${params}`);
});

// GET /api/auth/google/callback — exchange code, upsert subscriber, issue cookie
router.get('/google/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query as { code?: string; state?: string; error?: string };

  // Reject if the state nonce is missing or doesn't match the cookie we set.
  const expectedState = req.cookies?.oauth_state;
  res.clearCookie('oauth_state', { httpOnly: true, sameSite: 'lax' });
  if (error || !code || !state || !expectedState || state !== expectedState) {
    res.redirect(`${frontendUrl()}/#/adventures?auth=error`);
    return;
  }

  try {
    const tokenRes = await fetch(GOOGLE_TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL!,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
      res.redirect(`${frontendUrl()}/#/adventures?auth=error`);
      return;
    }

    const profileRes = await fetch(GOOGLE_USERINFO, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json() as {
      id: string; email: string; name: string; picture?: string;
    };

    const subscriber = await prisma.googleSubscriber.upsert({
      where: { googleId: profile.id },
      create: {
        googleId: profile.id,
        email: profile.email,
        name: profile.name,
        picture: profile.picture ?? null,
      },
      update: {
        email: profile.email,
        name: profile.name,
        picture: profile.picture ?? null,
      },
    });

    const token = jwt.sign(
      { sub: subscriber.googleId, email: subscriber.email, type: 'subscriber' },
      process.env.JWT_SUBSCRIBER_SECRET!,
      { expiresIn: '30d' },
    );

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('subscriber_token', token, {
      httpOnly: true,
      secure: req.secure,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      // In dev, set domain to 'localhost' so the cookie is shared across all ports
      ...(!isProd && { domain: 'localhost' }),
    });

    res.redirect(`${frontendUrl()}/#/adventures`);
  } catch (err) {
    console.error('[Google OAuth callback]', err);
    res.redirect(`${frontendUrl()}/#/adventures?auth=error`);
  }
});

// GET /api/auth/subscriber/me
router.get('/subscriber/me', async (req: Request, res: Response) => {
  const token = req.cookies?.subscriber_token;
  if (!token) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SUBSCRIBER_SECRET!) as { sub: string; email: string; type: string };
    if (payload.type !== 'subscriber') {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
    const subscriber = await prisma.googleSubscriber.findUnique({ where: { googleId: payload.sub } });
    if (!subscriber) {
      res.clearCookie('subscriber_token', { httpOnly: true, sameSite: 'strict' });
      res.status(401).json({ message: 'Subscriber not found' });
      return;
    }
    res.json({
      data: {
        id: subscriber.id,
        googleId: subscriber.googleId,
        email: subscriber.email,
        name: subscriber.name,
        picture: subscriber.picture,
        createdAt: subscriber.createdAt.toISOString(),
      },
    });
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// POST /api/auth/subscriber/logout
router.post('/subscriber/logout', (_req: Request, res: Response) => {
  res.clearCookie('subscriber_token', { httpOnly: true, sameSite: 'strict' });
  res.json({ data: null, message: 'Logged out' });
});

export default router;
