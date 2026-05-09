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
import uploadRouter from './routes/upload';
import internalRouter from './routes/internal';
import aiChatRouter from './routes/ai-chat';

// ─── Startup validation ───────────────────────────────────────────────────────
const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'INTERNAL_API_KEY'];
for (const key of required) {
  if (!process.env[key] || process.env[key]!.length < 16) {
    throw new Error(`Missing or too short env var: ${key} (min 16 chars)`);
  }
}

const app = express();
const port = process.env.PORT || 3000;

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
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/admin', adminRouter);
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
