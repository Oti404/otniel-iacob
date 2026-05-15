/**
 * Internal API — used exclusively by n8n automation.
 * Protected by x-internal-key header using crypto.timingSafeEqual,
 * which prevents timing attacks that could leak the key length or value
 * through response time differences.
 *
 * POST /projects supports inline newContributors creation (n8n sends names, not IDs).
 */
import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@monorepo/database';
import { contributorEntitySchema, projectSchema } from '@monorepo/shared';
import crypto from 'crypto';
import { z } from 'zod';

const router = Router();

function internalKeyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['x-internal-key'];
  const expected = process.env.INTERNAL_API_KEY;
  if (!key || !expected || typeof key !== 'string') {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  try {
    const valid = crypto.timingSafeEqual(Buffer.from(key), Buffer.from(expected));
    if (!valid) { res.status(401).json({ message: 'Unauthorized' }); return; }
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  next();
}

router.use(internalKeyMiddleware);

// Extends the shared projectSchema with:
// - max-length constraints (n8n content can be verbose)
// - date without .datetime() (n8n doesn't always send full ISO strings)
// - display optional (defaults true when omitted)
// - newContributors: n8n sends names, not IDs, so contributors can be created inline
const internalProjectSchema = projectSchema.omit({ order: true }).extend({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  tech: z.string().min(1).max(500),
  awards: z.string().max(500).optional().nullable(),
  display: z.boolean().optional(),
  date: z.string().min(1),
  endDate: z.string().optional().nullable(),
  contributorIds: z.array(z.number().int().positive()).optional(),
  newContributors: z.array(z.object({
    name: z.string().min(1).max(100),
    link: z.string().url().optional().nullable(),
  })).optional(),
});

router.get('/contributors', async (_req: Request, res: Response) => {
  try {
    const contributors = await prisma.contributor.findMany({ orderBy: { name: 'asc' } });
    res.json({ data: contributors });
  } catch (error) {
    console.error('[GET /internal/contributors]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/contributors', async (req: Request, res: Response) => {
  const parsed = contributorEntitySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.errors[0]?.message ?? 'Validation error' });
    return;
  }
  try {
    const contributor = await prisma.contributor.create({ data: parsed.data });
    res.status(201).json({ data: contributor });
  } catch (error) {
    console.error('[POST /internal/contributors]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/projects', async (req: Request, res: Response) => {
  const parsed = internalProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.errors[0]?.message ?? 'Validation error' });
    return;
  }
  const { contributorIds, newContributors, date, endDate, ...rest } = parsed.data;
  try {
    const allContributorIds = [...(contributorIds ?? [])];

    if (newContributors?.length) {
      for (const c of newContributors) {
        const created = await prisma.contributor.create({ data: { name: c.name, link: c.link ?? null } });
        allContributorIds.push(created.id);
      }
    }

    const maxResult = await prisma.project.aggregate({ _max: { order: true } });
    const nextOrder = (maxResult._max.order ?? 0) + 1;

    const project = await prisma.project.create({
      data: {
        name: rest.name,
        description: rest.description,
        tech: rest.tech,
        status: rest.status,
        display: rest.display ?? true,
        link: rest.link ?? null,
        liveLink: rest.liveLink ?? null,
        awards: rest.awards ?? null,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        order: nextOrder,
        ...(allContributorIds.length
          ? { contributors: { create: allContributorIds.map((id) => ({ contributorId: id })) } }
          : {}),
      },
      include: { contributors: { include: { contributor: true } } },
    });

    res.status(201).json({ data: project });
  } catch (error) {
    console.error('[POST /internal/projects]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
