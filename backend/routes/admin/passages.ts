/**
 * Admin — passages (entries inside a chronicle). Mounted under /api/admin, JWT-gated in ./index.ts.
 */
import { Router, Request, Response } from 'express';
import { prisma } from '@monorepo/database';
import { passageSchema, publishedAtSchema } from '@monorepo/shared';
import { parseBody, parseId } from '../../lib/request';
import { badRequest, notFound } from '../../lib/http-error';
import { notifySubscribers } from '../../services/push';
import { deleteMediaFiles, mapPassage, toNoonUtc } from '../../services/adventures';

const router = Router();

async function findPassage(id: number) {
  const passage = await prisma.passage.findUnique({ where: { id } });
  if (!passage) throw notFound('Passage');
  return passage;
}

router.get('/chronicles/:id/passages', async (req: Request, res: Response) => {
  const passages = await prisma.passage.findMany({
    where: { chronicleId: parseId(req) },
    orderBy: { order: 'asc' },
    include: { media: { orderBy: { order: 'asc' } } },
  });
  res.json({ data: passages.map(mapPassage) });
});

router.post('/chronicles/:id/passages', async (req: Request, res: Response) => {
  const chronicleId = parseId(req);
  const d = parseBody(passageSchema, req.body);
  const chronicle = await prisma.chronicle.findUnique({ where: { id: chronicleId }, select: { id: true } });
  if (!chronicle) throw notFound('Chronicle');
  const passage = await prisma.passage.create({
    data: { title: d.title, content: d.content ?? null, order: d.order, chronicleId },
    include: { media: true },
  });
  res.status(201).json({ data: mapPassage(passage) });
});

router.put('/passages/:pid', async (req: Request, res: Response) => {
  const id = parseId(req, 'pid');
  const d = parseBody(passageSchema, req.body);
  const passage = await prisma.passage.update({
    where: { id },
    data: { title: d.title, content: d.content ?? null, order: d.order },
    include: { media: { orderBy: { order: 'asc' } } },
  });
  res.json({ data: mapPassage(passage) });
});

router.delete('/passages/:pid', async (req: Request, res: Response) => {
  const id = parseId(req, 'pid');
  await findPassage(id);
  const media = await prisma.passageMedia.findMany({ where: { passageId: id } });
  await prisma.passage.delete({ where: { id } });
  await deleteMediaFiles(media);
  res.json({ data: { id } });
});

router.post('/passages/:pid/publish', async (req: Request, res: Response) => {
  const id = parseId(req, 'pid');
  const existing = await findPassage(id);
  if (existing.publishedAt) throw badRequest('Already published');
  const passage = await prisma.passage.update({ where: { id }, data: { publishedAt: new Date() } });
  notifySubscribers('chronicle', existing.chronicleId).catch((err) => console.error('[push] passage notify failed', err));
  res.json({ data: mapPassage(passage) });
});

// Editing the publish date is only allowed once published — backdating past trips.
router.put('/passages/:pid/published-at', async (req: Request, res: Response) => {
  const id = parseId(req, 'pid');
  const { publishedAt } = parseBody(publishedAtSchema, req.body);
  const existing = await findPassage(id);
  if (!existing.publishedAt) throw badRequest('Publish it first before editing the date');
  const passage = await prisma.passage.update({ where: { id }, data: { publishedAt: toNoonUtc(publishedAt) } });
  res.json({ data: mapPassage(passage) });
});

export default router;
