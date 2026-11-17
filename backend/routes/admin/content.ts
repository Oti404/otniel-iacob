/**
 * Admin — portfolio content CRUD (profile, projects, contributors, experience,
 * hobbies, semesters, subjects). Mounted under /api/admin, JWT-gated in ./index.ts.
 *
 * Semesters: DELETE removes child Subjects first.
 * Projects:  contributor M:M rows are replaced in one transaction on PUT.
 */
import { Router, Request, Response } from 'express';
import { prisma, Prisma } from '@monorepo/database';
import {
  profileSchema,
  projectSchema,
  contributorEntitySchema,
  experienceSchema,
  semesterSchema,
  subjectSchema,
  hobbySchema,
} from '@monorepo/shared';
import { parseBody, parseId } from '../../lib/request';
import { badRequest } from '../../lib/http-error';

const router = Router();

const withContributors = { contributors: { include: { contributor: true } } } as const;

/** Semester ids are strings (e.g. "y1s1"), not integers. */
function semesterId(req: Request): string {
  const id = String(req.params['id']);
  if (!id || id.length > 50) throw badRequest('Invalid id');
  return id;
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────

router.put('/profile', async (req: Request, res: Response) => {
  const d = parseBody(profileSchema, req.body);
  const profile = await prisma.profile.upsert({ where: { id: 1 }, update: d, create: d });
  res.json({ data: profile });
});

// ─── PROJECTS ────────────────────────────────────────────────────────────────

router.post('/projects', async (req: Request, res: Response) => {
  const d = parseBody(projectSchema, req.body);
  const max = await prisma.project.aggregate({ _max: { order: true } });
  const project = await prisma.project.create({
    data: {
      name: d.name, description: d.description, tech: d.tech, display: d.display,
      status: d.status, order: (max._max.order ?? 0) + 1, date: new Date(d.date),
      link: d.link ?? null, liveLink: d.liveLink ?? null, awards: d.awards ?? null,
      endDate: d.endDate ? new Date(d.endDate) : null,
      ...(d.contributorIds?.length
        ? { contributors: { create: d.contributorIds.map((contributorId) => ({ contributorId })) } }
        : {}),
    },
    include: withContributors,
  });
  res.status(201).json({ data: project });
});

router.put('/projects/:id', async (req: Request, res: Response) => {
  const id = parseId(req);
  const d = parseBody(projectSchema.partial(), req.body);

  const data: Prisma.ProjectUpdateInput = {};
  if (d.name !== undefined) data.name = d.name;
  if (d.description !== undefined) data.description = d.description;
  if (d.tech !== undefined) data.tech = d.tech;
  if (d.display !== undefined) data.display = d.display;
  if (d.status !== undefined) data.status = d.status;
  if (d.order !== undefined) data.order = d.order;
  if (d.date !== undefined) data.date = new Date(d.date);
  if (d.endDate !== undefined) data.endDate = d.endDate ? new Date(d.endDate) : null;
  if (d.link !== undefined) data.link = d.link ?? null;
  if (d.liveLink !== undefined) data.liveLink = d.liveLink ?? null;
  if (d.awards !== undefined) data.awards = d.awards ?? null;

  const project = await prisma.$transaction(async (tx) => {
    if (d.contributorIds !== undefined) {
      await tx.projectContributor.deleteMany({ where: { projectId: id } });
      if (d.contributorIds?.length) {
        await tx.projectContributor.createMany({
          data: d.contributorIds.map((contributorId) => ({ projectId: id, contributorId })),
        });
      }
    }
    return tx.project.update({ where: { id }, data, include: withContributors });
  });
  res.json({ data: project });
});

router.delete('/projects/:id', async (req: Request, res: Response) => {
  const id = parseId(req);
  await prisma.project.delete({ where: { id } });
  res.json({ data: { id } });
});

// ─── CONTRIBUTORS ────────────────────────────────────────────────────────────

router.get('/contributors', async (_req: Request, res: Response) => {
  res.json({ data: await prisma.contributor.findMany({ orderBy: { name: 'asc' } }) });
});

router.post('/contributors', async (req: Request, res: Response) => {
  const contributor = await prisma.contributor.create({ data: parseBody(contributorEntitySchema, req.body) });
  res.status(201).json({ data: contributor });
});

router.put('/contributors/:id', async (req: Request, res: Response) => {
  const id = parseId(req);
  const contributor = await prisma.contributor.update({ where: { id }, data: parseBody(contributorEntitySchema, req.body) });
  res.json({ data: contributor });
});

router.delete('/contributors/:id', async (req: Request, res: Response) => {
  const id = parseId(req);
  await prisma.contributor.delete({ where: { id } });
  res.json({ data: { id } });
});

// ─── EXPERIENCE ──────────────────────────────────────────────────────────────

function experienceData(d: ReturnType<typeof experienceSchema.parse>) {
  return {
    company: d.company, role: d.role, tech: d.tech, type: d.type, order: d.order,
    description: d.description, startDate: new Date(d.startDate),
    endDate: d.endDate ? new Date(d.endDate) : null,
  };
}

router.post('/experience', async (req: Request, res: Response) => {
  const exp = await prisma.experience.create({ data: experienceData(parseBody(experienceSchema, req.body)) });
  res.status(201).json({ data: exp });
});

router.put('/experience/:id', async (req: Request, res: Response) => {
  const id = parseId(req);
  const exp = await prisma.experience.update({ where: { id }, data: experienceData(parseBody(experienceSchema, req.body)) });
  res.json({ data: exp });
});

router.delete('/experience/:id', async (req: Request, res: Response) => {
  const id = parseId(req);
  await prisma.experience.delete({ where: { id } });
  res.json({ data: { id } });
});

// ─── HOBBIES ─────────────────────────────────────────────────────────────────

router.post('/hobbies', async (req: Request, res: Response) => {
  const hobby = await prisma.hobby.create({ data: parseBody(hobbySchema, req.body) });
  res.status(201).json({ data: hobby });
});

router.put('/hobbies/:id', async (req: Request, res: Response) => {
  const id = parseId(req);
  const hobby = await prisma.hobby.update({ where: { id }, data: parseBody(hobbySchema, req.body) });
  res.json({ data: hobby });
});

router.delete('/hobbies/:id', async (req: Request, res: Response) => {
  const id = parseId(req);
  await prisma.hobby.delete({ where: { id } });
  res.json({ data: { id } });
});

// ─── SEMESTERS ───────────────────────────────────────────────────────────────

router.post('/semesters', async (req: Request, res: Response) => {
  const semester = await prisma.semester.create({ data: parseBody(semesterSchema, req.body) });
  res.status(201).json({ data: semester });
});

router.put('/semesters/:id', async (req: Request, res: Response) => {
  const id = semesterId(req);
  const semester = await prisma.semester.update({ where: { id }, data: parseBody(semesterSchema, req.body) });
  res.json({ data: semester });
});

router.delete('/semesters/:id', async (req: Request, res: Response) => {
  const id = semesterId(req);
  await prisma.$transaction([
    prisma.subject.deleteMany({ where: { semesterId: id } }),
    prisma.semester.delete({ where: { id } }),
  ]);
  res.json({ data: { id } });
});

// ─── SUBJECTS ────────────────────────────────────────────────────────────────

function subjectData(d: ReturnType<typeof subjectSchema.parse>) {
  return {
    code: d.code, name: d.name, passed: d.passed, credits: d.credits,
    semesterId: d.semesterId, docPath: d.docPath ?? null,
  };
}

// An unknown semesterId fails the foreign key → 400 via the error handler (P2003).
router.post('/subjects', async (req: Request, res: Response) => {
  const subject = await prisma.subject.create({ data: subjectData(parseBody(subjectSchema, req.body)) });
  res.status(201).json({ data: subject });
});

router.put('/subjects/:id', async (req: Request, res: Response) => {
  const id = parseId(req);
  const subject = await prisma.subject.update({ where: { id }, data: subjectData(parseBody(subjectSchema, req.body)) });
  res.json({ data: subject });
});

router.delete('/subjects/:id', async (req: Request, res: Response) => {
  const id = parseId(req);
  await prisma.subject.delete({ where: { id } });
  res.json({ data: { id } });
});

export default router;
