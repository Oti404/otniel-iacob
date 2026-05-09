import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@monorepo/database';

const router = Router();

function internalKeyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['x-internal-key'];
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  next();
}

router.use(internalKeyMiddleware);

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
  const { name, link } = req.body;
  if (!name) { res.status(400).json({ message: 'Name is required' }); return; }
  try {
    const contributor = await prisma.contributor.create({ data: { name, link: link ?? null } });
    res.status(201).json({ data: contributor });
  } catch (error) {
    console.error('[POST /internal/contributors]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/projects', async (req: Request, res: Response) => {
  const { name, description, tech, link, liveLink, contributorIds, newContributors, awards, display, date, endDate, status } = req.body;
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
        name, description, tech, display: display ?? true,
        status, order: nextOrder,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        link: link ?? null, liveLink: liveLink ?? null, awards: awards ?? null,
        ...(allContributorIds.length
          ? { contributors: { create: allContributorIds.map((id: number) => ({ contributorId: id })) } }
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
