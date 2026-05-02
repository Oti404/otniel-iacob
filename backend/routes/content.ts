import { Router, Request, Response } from 'express';
import { prisma } from '@monorepo/database';
import { ApiResponse, Profile, Project, Experience, Semester, Hobby } from '@monorepo/shared';

const router = Router();

router.get('/profile', async (_req: Request, res: Response) => {
  try {
    const profile = await prisma.profile.findFirst();
    const response: ApiResponse<Profile | null> = { data: profile as Profile | null };
    res.json(response);
  } catch (error) {
    console.error('[GET /profile]', error);
    res.status(500).json({ data: null, message: 'Internal server error' });
  }
});

router.get('/projects', async (_req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      where: { display: true },
      orderBy: { order: 'asc' },
    });
    const mapped = projects.map((p) => ({
      ...p,
      date: p.date.toISOString(),
      endDate: p.endDate?.toISOString() ?? null,
    }));
    const response: ApiResponse<Project[]> = { data: mapped as Project[] };
    res.json(response);
  } catch (error) {
    console.error('[GET /projects]', error);
    res.status(500).json({ data: [], message: 'Internal server error' });
  }
});

router.get('/experience', async (_req: Request, res: Response) => {
  try {
    const experiences = await prisma.experience.findMany({
      orderBy: { order: 'asc' },
    });
    const mapped = experiences.map((e) => ({
      ...e,
      startDate: e.startDate.toISOString(),
      endDate: e.endDate?.toISOString() ?? null,
      description: e.description as string[],
    }));
    const response: ApiResponse<Experience[]> = { data: mapped as Experience[] };
    res.json(response);
  } catch (error) {
    console.error('[GET /experience]', error);
    res.status(500).json({ data: [], message: 'Internal server error' });
  }
});

router.get('/semesters', async (_req: Request, res: Response) => {
  try {
    const semesters = await prisma.semester.findMany({
      orderBy: { order: 'asc' },
      include: { subjects: true },
    });
    const response: ApiResponse<Semester[]> = { data: semesters as Semester[] };
    res.json(response);
  } catch (error) {
    console.error('[GET /semesters]', error);
    res.status(500).json({ data: [], message: 'Internal server error' });
  }
});

router.get('/hobbies', async (_req: Request, res: Response) => {
  try {
    const hobbies = await prisma.hobby.findMany({ orderBy: { order: 'asc' } });
    const response: ApiResponse<Hobby[]> = { data: hobbies as Hobby[] };
    res.json(response);
  } catch (error) {
    console.error('[GET /hobbies]', error);
    res.status(500).json({ data: [], message: 'Internal server error' });
  }
});

export default router;
