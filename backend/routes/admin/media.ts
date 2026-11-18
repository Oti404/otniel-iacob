/**
 * Admin — passage media (images, videos → Cloudinary; YouTube → link only).
 * Mounted under /api/admin, JWT-gated in ./index.ts.
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@monorepo/database';
import { passageMediaSchema } from '@monorepo/shared';
import { parseBody, parseId } from '../../lib/request';
import { badRequest, notFound, serviceUnavailable } from '../../lib/http-error';
import { mediaUpload } from '../../middleware/media-upload';
import { isCloudinaryConfigured, uploadToCloudinary } from '../../services/cloudinary';
import { deleteMediaFiles } from '../../services/adventures';

const router = Router();

const orderSchema = z.object({ order: z.coerce.number().int().min(0) });

async function assertPassage(id: number): Promise<void> {
  const passage = await prisma.passage.findUnique({ where: { id }, select: { id: true } });
  if (!passage) throw notFound('Passage');
}

// YouTube link — JSON body
router.post('/passages/:pid/media', async (req: Request, res: Response) => {
  const passageId = parseId(req, 'pid');
  const d = parseBody(passageMediaSchema, req.body);
  if (d.type !== 'YOUTUBE') throw badRequest('Use /media/upload for IMAGE and VIDEO');
  await assertPassage(passageId);
  const media = await prisma.passageMedia.create({
    data: { url: d.url, type: d.type, order: d.order, caption: d.caption ?? null, passageId },
  });
  res.status(201).json({ data: media });
});

// Image / video file → Cloudinary
router.post('/passages/:pid/media/upload', mediaUpload.single('file'), async (req: Request, res: Response) => {
  if (!isCloudinaryConfigured()) throw serviceUnavailable('Cloudinary not configured');
  if (!req.file) throw badRequest('No file provided');
  const passageId = parseId(req, 'pid');
  await assertPassage(passageId);

  const isVideo = req.file.mimetype.startsWith('video/');
  const { url, publicId } = await uploadToCloudinary(req.file.buffer, 'adventures', isVideo ? 'video' : 'image');
  const caption = typeof req.body['caption'] === 'string' ? req.body['caption'].slice(0, 500) : null;
  const maxOrder = await prisma.passageMedia.aggregate({ _max: { order: true }, where: { passageId } });

  const media = await prisma.passageMedia.create({
    data: {
      passageId,
      url,
      cloudinaryId: publicId,
      type: isVideo ? 'VIDEO' : 'IMAGE',
      order: (maxOrder._max.order ?? 0) + 1,
      caption,
    },
  });
  res.status(201).json({ data: media });
});

router.delete('/media/:mid', async (req: Request, res: Response) => {
  const id = parseId(req, 'mid');
  const media = await prisma.passageMedia.findUnique({ where: { id } });
  if (!media) throw notFound('Media');
  await prisma.passageMedia.delete({ where: { id } });
  await deleteMediaFiles([media]);
  res.json({ data: { id } });
});

router.put('/media/:mid/order', async (req: Request, res: Response) => {
  const id = parseId(req, 'mid');
  const { order } = parseBody(orderSchema, req.body);
  const media = await prisma.passageMedia.update({ where: { id }, data: { order } });
  res.json({ data: media });
});

export default router;
