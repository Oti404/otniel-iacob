import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express, { Request, Response } from 'express';
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

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:4200', 'http://localhost:80'];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
