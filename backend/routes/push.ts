import { Router, Request, Response } from 'express';
import { prisma } from '@monorepo/database';
import { pushSubscribeSchema } from '@monorepo/shared';
import { isPushConfigured } from '../services/push';
import { getSubscriber } from '../middleware/subscriber';

const router = Router();

const MAX_DEVICES_PER_SUBSCRIBER = 10;

// GET /api/push/vapid-public-key
router.get('/vapid-public-key', (_req: Request, res: Response) => {
  if (!isPushConfigured()) {
    res.status(503).json({ message: 'Push not configured' });
    return;
  }
  res.json({ data: process.env.VAPID_PUBLIC_KEY });
});

// POST /api/push/subscribe
router.post('/subscribe', async (req: Request, res: Response) => {
  const subscriber = await getSubscriber(req);
  if (!subscriber) { res.status(401).json({ message: 'Not authenticated' }); return; }

  const parsed = pushSubscribeSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: 'Invalid subscription data' }); return; }

  const { endpoint, p256dh, auth } = parsed.data;

  try {
    const [known, count] = await Promise.all([
      prisma.pushSubscription.findUnique({ where: { endpoint } }),
      prisma.pushSubscription.count({ where: { subscriberId: subscriber.id } }),
    ]);
    if (!known && count >= MAX_DEVICES_PER_SUBSCRIBER) {
      res.status(409).json({ message: 'Too many devices registered' });
      return;
    }

    const ps = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh, auth, subscriberId: subscriber.id },
      create: { endpoint, p256dh, auth, subscriberId: subscriber.id },
    });
    res.status(201).json({ data: { id: ps.id } });
  } catch (error) {
    console.error('[POST /api/push/subscribe]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/push/unsubscribe
router.delete('/unsubscribe', async (req: Request, res: Response) => {
  const subscriber = await getSubscriber(req);
  if (!subscriber) { res.status(401).json({ message: 'Not authenticated' }); return; }

  const endpoint = req.body?.endpoint;
  if (!endpoint || typeof endpoint !== 'string') {
    res.status(400).json({ message: 'endpoint required' });
    return;
  }

  try {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint, subscriberId: subscriber.id },
    });
    res.json({ data: null });
  } catch (error) {
    console.error('[DELETE /api/push/unsubscribe]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
