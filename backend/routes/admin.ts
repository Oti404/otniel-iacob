import { Router, Request, Response } from 'express';
import { prisma, Prisma } from '@monorepo/database';
import { authMiddleware } from '../middleware/auth';
import {
  profileSchema,
  projectSchema,
  experienceSchema,
  semesterSchema,
  subjectSchema,
  hobbySchema,
} from '@monorepo/shared';

const router = Router();
router.use(authMiddleware);

function zodError(parsed: { success: false; error: { errors: { message: string }[] } }): string {
  return parsed.error.errors[0]?.message ?? 'Validation error';
}

function id(req: Request): number {
  return parseInt(String(req.params['id']));
}

function strId(req: Request): string {
  return String(req.params['id']);
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────

router.put('/profile', async (req: Request, res: Response) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: zodError(parsed) }); return; }
  try {
    const profile = await prisma.profile.upsert({
      where: { id: 1 },
      update: parsed.data,
      create: parsed.data,
    });
    res.json({ data: profile });
  } catch (error) {
    console.error('[PUT /admin/profile]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── PROJECTS ────────────────────────────────────────────────────────────────

router.post('/projects', async (req: Request, res: Response) => {
  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: zodError(parsed) }); return; }
  try {
    const d = parsed.data;
    const project = await prisma.project.create({
      data: {
        name: d.name, description: d.description, tech: d.tech, display: d.display,
        status: d.status, order: d.order, date: new Date(d.date),
        link: d.link ?? null, liveLink: d.liveLink ?? null,
        contributors: d.contributors ?? Prisma.JsonNull, awards: d.awards ?? null,
        endDate: d.endDate ? new Date(d.endDate) : null,
      },
    });
    res.status(201).json({ data: project });
  } catch (error) {
    console.error('[POST /admin/projects]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/projects/:id', async (req: Request, res: Response) => {
  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: zodError(parsed) }); return; }
  try {
    const d = parsed.data;
    const project = await prisma.project.update({
      where: { id: id(req) },
      data: {
        name: d.name, description: d.description, tech: d.tech, display: d.display,
        status: d.status, order: d.order, date: new Date(d.date),
        link: d.link ?? null, liveLink: d.liveLink ?? null,
        contributors: d.contributors ?? Prisma.JsonNull, awards: d.awards ?? null,
        endDate: d.endDate ? new Date(d.endDate) : null,
      },
    });
    res.json({ data: project });
  } catch {
    res.status(404).json({ message: 'Project not found' });
  }
});

router.delete('/projects/:id', async (req: Request, res: Response) => {
  try {
    await prisma.project.delete({ where: { id: id(req) } });
    res.json({ data: { id: id(req) } });
  } catch {
    res.status(404).json({ message: 'Project not found' });
  }
});

// ─── EXPERIENCE ──────────────────────────────────────────────────────────────

router.post('/experience', async (req: Request, res: Response) => {
  const parsed = experienceSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: zodError(parsed) }); return; }
  try {
    const d = parsed.data;
    const exp = await prisma.experience.create({
      data: {
        company: d.company, role: d.role, tech: d.tech, type: d.type, order: d.order,
        description: d.description, startDate: new Date(d.startDate),
        endDate: d.endDate ? new Date(d.endDate) : null,
      },
    });
    res.status(201).json({ data: exp });
  } catch (error) {
    console.error('[POST /admin/experience]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/experience/:id', async (req: Request, res: Response) => {
  const parsed = experienceSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: zodError(parsed) }); return; }
  try {
    const d = parsed.data;
    const exp = await prisma.experience.update({
      where: { id: id(req) },
      data: {
        company: d.company, role: d.role, tech: d.tech, type: d.type, order: d.order,
        description: d.description, startDate: new Date(d.startDate),
        endDate: d.endDate ? new Date(d.endDate) : null,
      },
    });
    res.json({ data: exp });
  } catch {
    res.status(404).json({ message: 'Experience not found' });
  }
});

router.delete('/experience/:id', async (req: Request, res: Response) => {
  try {
    await prisma.experience.delete({ where: { id: id(req) } });
    res.json({ data: { id: id(req) } });
  } catch {
    res.status(404).json({ message: 'Experience not found' });
  }
});

// ─── HOBBIES ─────────────────────────────────────────────────────────────────

router.post('/hobbies', async (req: Request, res: Response) => {
  const parsed = hobbySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: zodError(parsed) }); return; }
  try {
    const hobby = await prisma.hobby.create({ data: parsed.data });
    res.status(201).json({ data: hobby });
  } catch (error) {
    console.error('[POST /admin/hobbies]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/hobbies/:id', async (req: Request, res: Response) => {
  const parsed = hobbySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: zodError(parsed) }); return; }
  try {
    const hobby = await prisma.hobby.update({ where: { id: id(req) }, data: parsed.data });
    res.json({ data: hobby });
  } catch {
    res.status(404).json({ message: 'Hobby not found' });
  }
});

router.delete('/hobbies/:id', async (req: Request, res: Response) => {
  try {
    await prisma.hobby.delete({ where: { id: id(req) } });
    res.json({ data: { id: id(req) } });
  } catch {
    res.status(404).json({ message: 'Hobby not found' });
  }
});

// ─── SEMESTERS ───────────────────────────────────────────────────────────────

router.post('/semesters', async (req: Request, res: Response) => {
  const parsed = semesterSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: zodError(parsed) }); return; }
  try {
    const semester = await prisma.semester.create({ data: parsed.data });
    res.status(201).json({ data: semester });
  } catch (error) {
    console.error('[POST /admin/semesters]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/semesters/:id', async (req: Request, res: Response) => {
  const parsed = semesterSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: zodError(parsed) }); return; }
  try {
    const semester = await prisma.semester.update({ where: { id: strId(req) }, data: parsed.data });
    res.json({ data: semester });
  } catch {
    res.status(404).json({ message: 'Semester not found' });
  }
});

router.delete('/semesters/:id', async (req: Request, res: Response) => {
  const sid = strId(req);
  try {
    await prisma.subject.deleteMany({ where: { semesterId: sid } });
    await prisma.semester.delete({ where: { id: sid } });
    res.json({ data: { id: sid } });
  } catch {
    res.status(404).json({ message: 'Semester not found' });
  }
});

// ─── SUBJECTS ────────────────────────────────────────────────────────────────

router.post('/subjects', async (req: Request, res: Response) => {
  const parsed = subjectSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: zodError(parsed) }); return; }
  try {
    const semester = await prisma.semester.findUnique({ where: { id: parsed.data.semesterId } });
    if (!semester) { res.status(400).json({ message: 'Semester not found' }); return; }
    const d = parsed.data;
    const subject = await prisma.subject.create({
      data: {
        code: d.code, name: d.name, passed: d.passed, credits: d.credits,
        semesterId: d.semesterId, docPath: d.docPath ?? null,
      },
    });
    res.status(201).json({ data: subject });
  } catch (error) {
    console.error('[POST /admin/subjects]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/subjects/:id', async (req: Request, res: Response) => {
  const parsed = subjectSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: zodError(parsed) }); return; }
  try {
    const d = parsed.data;
    const subject = await prisma.subject.update({
      where: { id: id(req) },
      data: {
        code: d.code, name: d.name, passed: d.passed, credits: d.credits,
        semesterId: d.semesterId, docPath: d.docPath ?? null,
      },
    });
    res.json({ data: subject });
  } catch {
    res.status(404).json({ message: 'Subject not found' });
  }
});

router.delete('/subjects/:id', async (req: Request, res: Response) => {
  try {
    await prisma.subject.delete({ where: { id: id(req) } });
    res.json({ data: { id: id(req) } });
  } catch {
    res.status(404).json({ message: 'Subject not found' });
  }
});

export default router;
