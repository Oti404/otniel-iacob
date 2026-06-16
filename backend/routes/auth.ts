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
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { prisma } from '@monorepo/database';
import { loginSchema } from '@monorepo/shared';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
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

  const accessToken = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ sub: user.id }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: req.secure,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ data: { accessToken } });
});

router.post('/refresh', async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    res.status(401).json({ message: 'No refresh token' });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as unknown as { sub: number };
    const user = await prisma.adminUser.findUnique({ where: { id: payload.sub } });
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }
    const accessToken = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '15m' });
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
