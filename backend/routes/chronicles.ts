import { Router, Request, Response } from 'express';
import { prisma } from '@monorepo/database';

const router = Router();

router.get('/chronicles', async (_req: Request, res: Response) => {
  try {
    const chronicles = await prisma.chronicle.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { publishedAt: 'desc' },
      include: {
        passages: {
          where: { publishedAt: { not: null } },
          select: { id: true },
        },
      },
    });
    const mapped = chronicles.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      coverImage: c.coverImage,
      publishedAt: c.publishedAt!.toISOString(),
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      passageCount: c.passages.length,
    }));
    res.json({ data: mapped });
  } catch (error) {
    console.error('[GET /chronicles]', error);
    res.status(500).json({ data: [], message: 'Internal server error' });
  }
});

router.get('/chronicles/:id', async (req: Request, res: Response) => {
  const cid = parseInt(String(req.params['id']), 10);
  if (isNaN(cid) || cid < 1) { res.status(400).json({ message: 'Invalid ID' }); return; }
  try {
    const chronicle = await prisma.chronicle.findFirst({
      where: { id: cid, publishedAt: { not: null } },
      include: {
        passages: {
          where: { publishedAt: { not: null } },
          orderBy: { publishedAt: 'desc' },
          include: { media: { orderBy: { order: 'asc' } } },
        },
      },
    });
    if (!chronicle) { res.status(404).json({ message: 'Chronicle not found' }); return; }
    const mapped = {
      id: chronicle.id,
      title: chronicle.title,
      description: chronicle.description,
      coverImage: chronicle.coverImage,
      publishedAt: chronicle.publishedAt!.toISOString(),
      createdAt: chronicle.createdAt.toISOString(),
      updatedAt: chronicle.updatedAt.toISOString(),
      passages: chronicle.passages.map((p) => ({
        id: p.id,
        chronicleId: p.chronicleId,
        title: p.title,
        content: p.content,
        order: p.order,
        publishedAt: p.publishedAt!.toISOString(),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        media: p.media.map((m) => ({
          id: m.id,
          passageId: m.passageId,
          url: m.url,
          type: m.type,
          order: m.order,
          caption: m.caption,
        })),
      })),
    };
    res.json({ data: mapped });
  } catch (error) {
    console.error('[GET /chronicles/:id]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
