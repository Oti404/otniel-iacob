/**
 * Admin — chronicles (the adventure containers). Mounted under /api/admin, JWT-gated in ./index.ts.
 */
import { Router, Request, Response } from 'express';
import { prisma } from '@monorepo/database';
import { chronicleSchema, publishedAtSchema } from '@monorepo/shared';
import { parseBody, parseId } from '../../lib/request';
import { badRequest, notFound, serviceUnavailable } from '../../lib/http-error';
import { mediaUpload } from '../../middleware/media-upload';
import { isCloudinaryConfigured, uploadToCloudinary } from '../../services/cloudinary';
import { notifySubscribers } from '../../services/push';
import { deleteCover, deleteMediaFiles, mapChronicle, mapPassage, toNoonUtc } from '../../services/adventures';

const router = Router();

async function findChronicle(id: number) {
  const chronicle = await prisma.chronicle.findUnique({ where: { id } });
  if (!chronicle) throw notFound('Chronicle');
  return chronicle;
}

router.get('/chronicles', async (_req: Request, res: Response) => {
  const chronicles = await prisma.chronicle.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { passages: true } } },
  });
  res.json({
    data: chronicles.map((c) => ({ ...mapChronicle(c), passageCount: c._count.passages })),
  });
});

router.post('/chronicles', async (req: Request, res: Response) => {
  const d = parseBody(chronicleSchema, req.body);
  const chronicle = await prisma.chronicle.create({
    data: { title: d.title, description: d.description ?? null, coverImage: d.coverImage ?? null },
  });
  res.status(201).json({ data: mapChronicle(chronicle) });
});

// Cover image → Cloudinary. Returns the URL only; the form saves it via PUT.
router.post('/chronicles/upload-cover', mediaUpload.single('file'), async (req: Request, res: Response) => {
  if (!isCloudinaryConfigured()) throw serviceUnavailable('Cloudinary not configured');
  if (!req.file) throw badRequest('No file provided');
  if (!req.file.mimetype.startsWith('image/')) throw badRequest('Cover must be an image');
  const { url } = await uploadToCloudinary(req.file.buffer, 'covers', 'image');
  res.json({ data: { url } });
});

router.get('/chronicles/:id', async (req: Request, res: Response) => {
  const chronicle = await prisma.chronicle.findUnique({
    where: { id: parseId(req) },
    include: {
      passages: {
        orderBy: { order: 'asc' },
        include: { media: { orderBy: { order: 'asc' } } },
      },
    },
  });
  if (!chronicle) throw notFound('Chronicle');
  res.json({
    data: { ...mapChronicle(chronicle), passages: chronicle.passages.map(mapPassage) },
  });
});

router.put('/chronicles/:id', async (req: Request, res: Response) => {
  const id = parseId(req);
  const d = parseBody(chronicleSchema, req.body);
  const existing = await findChronicle(id);
  const coverImage = d.coverImage ?? null;
  const chronicle = await prisma.chronicle.update({
    where: { id },
    data: { title: d.title, description: d.description ?? null, coverImage },
  });
  if (existing.coverImage !== coverImage) await deleteCover(existing.coverImage);
  res.json({ data: mapChronicle(chronicle) });
});

router.delete('/chronicles/:id', async (req: Request, res: Response) => {
  const id = parseId(req);
  const chronicle = await findChronicle(id);
  const media = await prisma.passageMedia.findMany({ where: { passage: { chronicleId: id } } });
  await prisma.chronicle.delete({ where: { id } });
  await Promise.all([deleteMediaFiles(media), deleteCover(chronicle.coverImage)]);
  res.json({ data: { id } });
});

router.post('/chronicles/:id/publish', async (req: Request, res: Response) => {
  const id = parseId(req);
  const existing = await findChronicle(id);
  if (existing.publishedAt) throw badRequest('Already published');
  const chronicle = await prisma.chronicle.update({ where: { id }, data: { publishedAt: new Date() } });
  notifySubscribers('global', id).catch((err) => console.error('[push] chronicle notify failed', err));
  res.json({ data: mapChronicle(chronicle) });
});

// Editing the publish date is only allowed once published — backdating past trips.
router.put('/chronicles/:id/published-at', async (req: Request, res: Response) => {
  const id = parseId(req);
  const { publishedAt } = parseBody(publishedAtSchema, req.body);
  const existing = await findChronicle(id);
  if (!existing.publishedAt) throw badRequest('Publish it first before editing the date');
  const chronicle = await prisma.chronicle.update({ where: { id }, data: { publishedAt: toNoonUtc(publishedAt) } });
  res.json({ data: mapChronicle(chronicle) });
});

export default router;
