/**
 * Backend entry point.
 *
 * Startup: crashes immediately if JWT_SECRET, JWT_REFRESH_SECRET, JWT_SUBSCRIBER_SECRET, or
 * INTERNAL_API_KEY are missing or shorter than 16 chars — misconfigured deploys fail fast
 * rather than silently. JWT_SUBSCRIBER_SECRET must differ from JWT_SECRET: subscriber
 * (Google OAuth) tokens and admin tokens are deliberately signed with different secrets so
 * one can never be replayed as the other.
 *
 * Route layout:
 *   GET  /api/health          — DB connectivity probe
 *   GET  /api/*               — public content (no auth)
 *   POST /api/auth/*          — login / refresh / logout (rate-limited)
 *        /api/admin/*         — JWT-protected CRUD + upload + AI chat
 *        /api/internal/*      — n8n automation (x-internal-key)
 *   GET  /uploads/*           — static uploaded files
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import { prisma } from '@monorepo/database';
import { HealthStatus } from '@monorepo/shared';
import contentRouter from './routes/content';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import adminChroniclesRouter from './routes/admin-chronicles';
import uploadRouter from './routes/upload';
import internalRouter from './routes/internal';
import aiChatRouter from './routes/ai-chat';
import chroniclesRouter from './routes/chronicles';
import subscriberAuthRouter from './routes/subscriber-auth';
import subscriptionsRouter from './routes/subscriptions';
import pushRouter from './routes/push';

// ─── Startup validation ───────────────────────────────────────────────────────
const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'JWT_SUBSCRIBER_SECRET', 'INTERNAL_API_KEY'];
for (const key of required) {
  if (!process.env[key] || process.env[key]!.length < 16) {
    throw new Error(`Missing or too short env var: ${key} (min 16 chars)`);
  }
}
if (process.env.JWT_SECRET === process.env.JWT_SUBSCRIBER_SECRET) {
  throw new Error('JWT_SUBSCRIBER_SECRET must differ from JWT_SECRET — a subscriber token would be valid as an admin token otherwise.');
}

const app = express();
const port = process.env.PORT || 3000;

// Trust nginx (first hop) so req.secure reflects the real X-Forwarded-Proto,
// not just whether Express itself is terminating TLS.
app.set('trust proxy', 1);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:4200', 'http://localhost:80'];

app.disable('x-powered-by');
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many requests, please try again later.' },
});

// Subscriber-auth (Google OAuth + /subscriber/me polling) is unauthenticated
// and was previously unthrottled. More generous than the admin limiter since
// legit subscribers poll /subscriber/me, but still bounds anonymous abuse.
const subscriberLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later.' },
});

app.get('/api/health', async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'error';
    console.error('DB Connection Error:', error);
  }

  const response: HealthStatus = {
    status: 'ok',
    message: 'Backend is running',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  };
  res.json(response);
});

const uploadsDir = process.env.UPLOADS_DIR ?? './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(path.resolve(uploadsDir)));

app.use('/api', contentRouter);
app.use('/api', chroniclesRouter);
app.use('/api/auth', subscriberLimiter, subscriberAuthRouter);
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/push', pushRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin', adminChroniclesRouter);
app.use('/api/admin/upload', uploadRouter);
app.use('/api/internal', internalRouter);
app.use('/api/admin/ai-chat', aiChatRouter);

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled error]', err.message);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
