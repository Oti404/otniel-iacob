import { Router, Request, Response } from 'express';
import multer from 'multer';
import { prisma } from '@monorepo/database';
import { authMiddleware } from '../middleware/auth';
import { chronicleSchema, passageSchema, passageMediaSchema, publishedAtSchema } from '@monorepo/shared';
import {
  isCloudinaryConfigured,
  uploadToCloudinary,
  deleteFromCloudinary,
} from '../services/cloudinary';
import { notifySubscribers } from '../services/push';

const router = Router();
router.use(authMiddleware);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'];
    cb(null, allowed.includes(file.mimetype));
  },
});

function zodError(parsed: { success: false; error: { errors: { message: string }[] } }): string {
  return parsed.error.errors[0]?.message ?? 'Validation error';
}

function cid(req: Request): number {
  const n = parseInt(String(req.params['id']), 10);
  if (isNaN(n) || n < 1) throw new Error('Invalid chronicle ID');
  return n;
}

function pid(req: Request): number {
  const n = parseInt(String(req.params['pid']), 10);
  if (isNaN(n) || n < 1) throw new Error('Invalid passage ID');
  return n;
}

function mid(req: Request): number {
  const n = parseInt(String(req.params['mid']), 10);
  if (isNaN(n) || n < 1) throw new Error('Invalid media ID');
  return n;
}

function mapChronicle(c: { id: number; title: string; description: string | null; coverImage: string | null; publishedAt: Date | null; createdAt: Date; updatedAt: Date }) {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    coverImage: c.coverImage,
    publishedAt: c.publishedAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

// ─── CHRONICLES ───────────────────────────────────────────────────────────────

router.get('/chronicles', async (_req: Request, res: Response) => {
  try {
    const chronicles = await prisma.chronicle.findMany({
      orderBy: { createdAt: 'desc' },
      include: { passages: { select: { id: true } } },
    });
    const mapped = chronicles.map((c) => ({
      ...mapChronicle(c),
      passageCount: c.passages.length,
    }));
    res.json({ data: mapped });
  } catch (error) {
    console.error('[GET /admin/chronicles]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/chronicles', async (req: Request, res: Response) => {
  const parsed = chronicleSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: zodError(parsed) }); return; }
  try {
    const chronicle = await prisma.chronicle.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        coverImage: parsed.data.coverImage ?? null,
      },
    });
    res.status(201).json({ data: mapChronicle(chronicle) });
  } catch (error) {
    console.error('[POST /admin/chronicles]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/chronicles/:id', async (req: Request, res: Response) => {
  try {
    const chronicle = await prisma.chronicle.findUnique({
      where: { id: cid(req) },
      include: {
        passages: {
          orderBy: { order: 'asc' },
          include: { media: { orderBy: { order: 'asc' } } },
        },
      },
    });
    if (!chronicle) { res.status(404).json({ message: 'Chronicle not found' }); return; }
    const mapped = {
      ...mapChronicle(chronicle),
      passages: chronicle.passages.map((p) => ({
        id: p.id,
        chronicleId: p.chronicleId,
        title: p.title,
        content: p.content,
        order: p.order,
        publishedAt: p.publishedAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        media: p.media,
      })),
    };
    res.json({ data: mapped });
  } catch {
    res.status(404).json({ message: 'Chronicle not found' });
  }
});

router.put('/chronicles/:id', async (req: Request, res: Response) => {
  const parsed = chronicleSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: zodError(parsed) }); return; }
  try {
    const chronicle = await prisma.chronicle.update({
      where: { id: cid(req) },
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        coverImage: parsed.data.coverImage ?? null,
      },
    });
    res.json({ data: mapChronicle(chronicle) });
  } catch {
    res.status(404).json({ message: 'Chronicle not found' });
  }
});

router.delete('/chronicles/:id', async (req: Request, res: Response) => {
  const id = cid(req);
  try {
    const media = await prisma.passageMedia.findMany({
      where: { passage: { chronicleId: id } },
    });
    await Promise.all(
      media
        .filter((m) => m.cloudinaryId)
        .map((m) => deleteFromCloudinary(m.cloudinaryId!, m.type === 'VIDEO' ? 'video' : 'image')),
    );
    await prisma.chronicle.delete({ where: { id } });
    res.json({ data: { id } });
  } catch {
    res.status(404).json({ message: 'Chronicle not found' });
  }
});

router.post('/chronicles/:id/publish', async (req: Request, res: Response) => {
  const id = cid(req);
  try {
    const existing = await prisma.chronicle.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ message: 'Chronicle not found' }); return; }
    if (existing.publishedAt) { res.status(400).json({ message: 'Already published' }); return; }
    const chronicle = await prisma.chronicle.update({
      where: { id },
      data: { publishedAt: new Date() },
    });
    await notifySubscribers('global');
    res.json({ data: mapChronicle(chronicle) });
  } catch (error) {
    console.error('[POST /admin/chronicles/:id/publish]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Editing the publish date is only allowed once published — backdating past trips.
router.put('/chronicles/:id/published-at', async (req: Request, res: Response) => {
  const parsed = publishedAtSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: zodError(parsed) }); return; }
  const id = cid(req);
  try {
    const existing = await prisma.chronicle.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ message: 'Chronicle not found' }); return; }
    if (!existing.publishedAt) { res.status(400).json({ message: 'Publish it first before editing the date' }); return; }
    const chronicle = await prisma.chronicle.update({
      where: { id },
      data: { publishedAt: parsed.data.publishedAt },
    });
    res.json({ data: mapChronicle(chronicle) });
  } catch (error) {
    console.error('[PUT /admin/chronicles/:id/published-at]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── PASSAGES ─────────────────────────────────────────────────────────────────

router.get('/chronicles/:id/passages', async (req: Request, res: Response) => {
  try {
    const passages = await prisma.passage.findMany({
      where: { chronicleId: cid(req) },
      orderBy: { order: 'asc' },
      include: { media: { orderBy: { order: 'asc' } } },
    });
    const mapped = passages.map((p) => ({
      ...p,
      publishedAt: p.publishedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
    res.json({ data: mapped });
  } catch (error) {
    console.error('[GET /admin/chronicles/:id/passages]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/chronicles/:id/passages', async (req: Request, res: Response) => {
  const parsed = passageSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: zodError(parsed) }); return; }
  const id = cid(req);
  try {
    const chronicle = await prisma.chronicle.findUnique({ where: { id } });
    if (!chronicle) { res.status(404).json({ message: 'Chronicle not found' }); return; }
    const passage = await prisma.passage.create({
      data: { title: parsed.data.title, content: parsed.data.content ?? null, order: parsed.data.order, chronicleId: id },
      include: { media: true },
    });
    res.status(201).json({
      data: {
        ...passage,
        publishedAt: passage.publishedAt?.toISOString() ?? null,
        createdAt: passage.createdAt.toISOString(),
        updatedAt: passage.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[POST /admin/chronicles/:id/passages]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/passages/:pid', async (req: Request, res: Response) => {
  const parsed = passageSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: zodError(parsed) }); return; }
  try {
    const passage = await prisma.passage.update({
      where: { id: pid(req) },
      data: { title: parsed.data.title, content: parsed.data.content ?? null, order: parsed.data.order },
      include: { media: { orderBy: { order: 'asc' } } },
    });
    res.json({
      data: {
        ...passage,
        publishedAt: passage.publishedAt?.toISOString() ?? null,
        createdAt: passage.createdAt.toISOString(),
        updatedAt: passage.updatedAt.toISOString(),
      },
    });
  } catch {
    res.status(404).json({ message: 'Passage not found' });
  }
});

router.delete('/passages/:pid', async (req: Request, res: Response) => {
  const id = pid(req);
  try {
    const media = await prisma.passageMedia.findMany({ where: { passageId: id } });
    await Promise.all(
      media
        .filter((m) => m.cloudinaryId)
        .map((m) => deleteFromCloudinary(m.cloudinaryId!, m.type === 'VIDEO' ? 'video' : 'image')),
    );
    await prisma.passage.delete({ where: { id } });
    res.json({ data: { id } });
  } catch {
    res.status(404).json({ message: 'Passage not found' });
  }
});

router.post('/passages/:pid/publish', async (req: Request, res: Response) => {
  const id = pid(req);
  try {
    const existing = await prisma.passage.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ message: 'Passage not found' }); return; }
    if (existing.publishedAt) { res.status(400).json({ message: 'Already published' }); return; }
    const passage = await prisma.passage.update({
      where: { id },
      data: { publishedAt: new Date() },
    });
    await notifySubscribers('chronicle', existing.chronicleId);
    res.json({
      data: {
        ...passage,
        publishedAt: passage.publishedAt!.toISOString(),
        createdAt: passage.createdAt.toISOString(),
        updatedAt: passage.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[POST /admin/passages/:pid/publish]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Editing the publish date is only allowed once published — backdating past trips.
router.put('/passages/:pid/published-at', async (req: Request, res: Response) => {
  const parsed = publishedAtSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: zodError(parsed) }); return; }
  const id = pid(req);
  try {
    const existing = await prisma.passage.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ message: 'Passage not found' }); return; }
    if (!existing.publishedAt) { res.status(400).json({ message: 'Publish it first before editing the date' }); return; }
    const passage = await prisma.passage.update({
      where: { id },
      data: { publishedAt: parsed.data.publishedAt },
    });
    res.json({
      data: {
        ...passage,
        publishedAt: passage.publishedAt!.toISOString(),
        createdAt: passage.createdAt.toISOString(),
        updatedAt: passage.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[PUT /admin/passages/:pid/published-at]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── MEDIA ────────────────────────────────────────────────────────────────────

// YouTube link — JSON body
router.post('/passages/:pid/media', async (req: Request, res: Response) => {
  const parsed = passageMediaSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: zodError(parsed) }); return; }
  if (parsed.data.type !== 'YOUTUBE') {
    res.status(400).json({ message: 'Use /media/upload for IMAGE and VIDEO' });
    return;
  }
  const id = pid(req);
  try {
    const passage = await prisma.passage.findUnique({ where: { id } });
    if (!passage) { res.status(404).json({ message: 'Passage not found' }); return; }
    const media = await prisma.passageMedia.create({
      data: { url: parsed.data.url, type: parsed.data.type, order: parsed.data.order, caption: parsed.data.caption ?? null, passageId: id },
    });
    res.status(201).json({ data: media });
  } catch (error) {
    console.error('[POST /admin/passages/:pid/media]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Image / Video file upload → Cloudinary
router.post('/passages/:pid/media/upload', upload.single('file'), async (req: Request, res: Response) => {
  if (!isCloudinaryConfigured()) {
    res.status(503).json({ message: 'Cloudinary not configured' });
    return;
  }
  if (!req.file) { res.status(400).json({ message: 'No file provided' }); return; }
  const id = pid(req);
  try {
    const passage = await prisma.passage.findUnique({ where: { id } });
    if (!passage) { res.status(404).json({ message: 'Passage not found' }); return; }
    const isVideo = req.file.mimetype.startsWith('video/');
    const { url, publicId } = await uploadToCloudinary(
      req.file.buffer,
      'adventures',
      isVideo ? 'video' : 'image',
    );
    const caption = typeof req.body['caption'] === 'string' ? req.body['caption'] : null;
    const maxOrder = await prisma.passageMedia.aggregate({
      _max: { order: true },
      where: { passageId: id },
    });
    const media = await prisma.passageMedia.create({
      data: {
        passageId: id,
        url,
        cloudinaryId: publicId,
        type: isVideo ? 'VIDEO' : 'IMAGE',
        order: (maxOrder._max.order ?? 0) + 1,
        caption,
      },
    });
    res.status(201).json({ data: media });
  } catch (error) {
    console.error('[POST /admin/passages/:pid/media/upload]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/media/:mid', async (req: Request, res: Response) => {
  const id = mid(req);
  try {
    const media = await prisma.passageMedia.findUnique({ where: { id } });
    if (!media) { res.status(404).json({ message: 'Media not found' }); return; }
    if (media.cloudinaryId) {
      await deleteFromCloudinary(media.cloudinaryId, media.type === 'VIDEO' ? 'video' : 'image');
    }
    await prisma.passageMedia.delete({ where: { id } });
    res.json({ data: { id } });
  } catch (error) {
    console.error('[DELETE /admin/media/:mid]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/media/:mid/order', async (req: Request, res: Response) => {
  const order = parseInt(String(req.body['order']), 10);
  if (isNaN(order) || order < 0) { res.status(400).json({ message: 'Invalid order value' }); return; }
  try {
    const media = await prisma.passageMedia.update({
      where: { id: mid(req) },
      data: { order },
    });
    res.json({ data: media });
  } catch {
    res.status(404).json({ message: 'Media not found' });
  }
});

export default router;
