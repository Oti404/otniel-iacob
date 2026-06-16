/**
 * Auth routes — no JWT required, rate-limited at the app level (10 req / 15 min).
 *
 * Token strategy:
 *   - Access token: JWT signed with JWT_SECRET, 15-min TTL, sent in response body
 *   - Refresh token: JWT signed with JWT_REFRESH_SECRET, 7-day TTL, httpOnly cookie
 *     (sameSite:strict, secure only in production)
 *
 * POST /refresh re-fetches the user from DB so deleted accounts are rejected immediately.
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

router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error?.errors[0]?.message ?? 'Validation error' });
    return;
  }

  const { email, password } = parsed.data;

  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const accessToken = jwt.sign({ sub: user.id, email: user.email, type: 'admin' }, process.env.JWT_SECRET!, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ sub: user.id }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: req.secure,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ data: { accessToken } });
});

router.post('/refresh', refreshLimiter, async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    res.status(401).json({ message: 'No refresh token' });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as unknown as { sub: number };
    const user = await prisma.adminUser.findUnique({ where: { id: payload.sub } });
    if (!user) {
      // Same message as a bad/expired token — don't reveal whether the
      // account behind a validly-signed token still exists.
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }
    const accessToken = jwt.sign({ sub: user.id, email: user.email, type: 'admin' }, process.env.JWT_SECRET!, { expiresIn: '15m' });
    res.json({ data: { accessToken } });
  } catch {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });
  res.json({ data: null, message: 'Logged out' });
});

export default router;
