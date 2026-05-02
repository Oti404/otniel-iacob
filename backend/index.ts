import express, { Request, Response } from 'express';
import cors from 'cors';
import { prisma } from '@monorepo/database';
import { HealthStatus } from '@monorepo/shared';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    // Basic test query to verify DB connection
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'error';
    console.error('DB Connection Error:', error);
  }

  const response: HealthStatus = {
    status: 'ok',
    message: 'Backend is running with Prisma and Monorepo Shared Types!',
    database: dbStatus,
    timestamp: new Date().toISOString()
  };

  res.json(response);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
