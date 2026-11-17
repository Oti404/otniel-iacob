/**
 * Auth routes — no JWT required, rate-limited at the app level (10 req / 15 min).
 *
 * Token strategy:
 *   - Access token: JWT signed with JWT_SECRET, 15-min TTL, sent in response body
 *   - Refresh token: JWT signed with JWT_REFRESH_SECRET, 7-day TTL, httpOnly cookie
 *     (sameSite:strict, secure only in production)
 *
 * POST /refresh re-fetches the user from DB so deleted accounts are rejected immediately,
 * checks tokenVersion and rotates the refresh cookie. POST /logout bumps tokenVersion,
 * which revokes every refresh token issued before it.
 */
import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { prisma } from '@monorepo/database';
import { loginSchema } from '@monorepo/shared';

const router = Router();

// Split budgets: strict on /login (brute-force defense), looser on /refresh
// since the frontend interceptor calls it automatically on 401s and shouldn't
// be able to lock the admin out of logging in.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many requests, please try again later.' },
});
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { message: 'Too many requests, please try again later.' },
});

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Compared against when the email is unknown, so both paths cost one bcrypt round
// and response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-password', 12);

interface RefreshPayload { sub: number; ver: number }

function issueTokens(req: Request, res: Response, user: { id: number; email: string; tokenVersion: number }): string {
  const accessToken = jwt.sign({ sub: user.id, email: user.email, type: 'admin' }, process.env.JWT_SECRET!, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ sub: user.id, ver: user.tokenVersion }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: req.secure,
    sameSite: 'strict',
    maxAge: REFRESH_TTL_MS,
  });
  return accessToken;
}

router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error?.errors[0]?.message ?? 'Validation error' });
    return;
  }

  const { email, password } = parsed.data;

  const user = await prisma.adminUser.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  res.json({ data: { accessToken: issueTokens(req, res, user) } });
});

router.post('/refresh', refreshLimiter, async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    res.status(401).json({ message: 'No refresh token' });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as unknown as RefreshPayload;
    const user = await prisma.adminUser.findUnique({ where: { id: payload.sub } });
    // Same message for a missing account and a revoked token: don't reveal which.
    if (!user || payload.ver !== user.tokenVersion) {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }
    res.json({ data: { accessToken: issueTokens(req, res, user) } });
  } catch {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});

router.post('/logout', refreshLimiter, async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as unknown as RefreshPayload;
      await prisma.adminUser.updateMany({
        where: { id: payload.sub, tokenVersion: payload.ver },
        data: { tokenVersion: { increment: 1 } },
      });
    } catch {
      // Invalid or expired token: nothing to revoke, still clear the cookie.
    }
  }
  res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });
  res.json({ data: null, message: 'Logged out' });
});

export default router;
