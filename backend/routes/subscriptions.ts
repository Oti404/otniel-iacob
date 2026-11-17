import { Router, Request, Response } from 'express';
import { prisma } from '@monorepo/database';
import { subscriptionSchema } from '@monorepo/shared';
import { getSubscriber } from '../middleware/subscriber';

const router = Router();

// GET /api/subscriptions/mine
router.get('/mine', async (req: Request, res: Response) => {
  const subscriber = await getSubscriber(req);
  if (!subscriber) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  const subs = await prisma.subscription.findMany({
    where: { subscriberId: subscriber.id },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    data: subs.map(s => ({ ...s, createdAt: s.createdAt.toISOString() })),
  });
});

// POST /api/subscriptions
router.post('/', async (req: Request, res: Response) => {
  const subscriber = await getSubscriber(req);
  if (!subscriber) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  const parsed = subscriptionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid input', errors: parsed.error.flatten() });
    return;
  }

  const { type, chronicleId } = parsed.data;

  if (type === 'CHRONICLE' && !chronicleId) {
    res.status(400).json({ message: 'chronicleId required for CHRONICLE subscription' });
    return;
  }

  const resolvedChrId = type === 'GLOBAL' ? null : (chronicleId ?? null);

  // Only published chronicles can be followed; otherwise the FK error (500 vs 201)
  // would reveal which unpublished chronicle ids exist.
  if (resolvedChrId !== null) {
    const chronicle = await prisma.chronicle.findFirst({
      where: { id: resolvedChrId, publishedAt: { not: null } },
      select: { id: true },
    });
    if (!chronicle) {
      res.status(404).json({ message: 'Chronicle not found' });
      return;
    }
  }

  // findFirst + create to handle NULL correctly in the unique constraint
  const existing = await prisma.subscription.findFirst({
    where: { subscriberId: subscriber.id, type, chronicleId: resolvedChrId },
  });

  if (existing) {
    res.status(200).json({ data: { ...existing, createdAt: existing.createdAt.toISOString() } });
    return;
  }

  const sub = await prisma.subscription.create({
    data: { subscriberId: subscriber.id, type, chronicleId: resolvedChrId },
  });

  res.status(201).json({ data: { ...sub, createdAt: sub.createdAt.toISOString() } });
});

// DELETE /api/subscriptions/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const subscriber = await getSubscriber(req);
  if (!subscriber) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ message: 'Invalid subscription ID' });
    return;
  }

  const sub = await prisma.subscription.findFirst({
    where: { id, subscriberId: subscriber.id },
  });

  if (!sub) {
    res.status(404).json({ message: 'Subscription not found' });
    return;
  }

  await prisma.subscription.delete({ where: { id } });
  res.json({ data: null, message: 'Unsubscribed' });
});

export default router;
