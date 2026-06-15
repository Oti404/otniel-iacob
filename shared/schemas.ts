import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const profileSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  description: z.string().min(1),
  headline: z.string().nullable().optional().transform(v => v ?? null),
  quote: z.string().nullable().optional().transform(v => v ?? null),
  quoteAuthor: z.string().nullable().optional().transform(v => v ?? null),
  photo: z.string().min(1),
  avatar: z.string().min(1),
  cvPdf: z.string().min(1),
  location: z.string().min(1),
  email: z.string().email(),
  linkedin: z.string().url(),
  github: z.string().url(),
});

export const contributorEntitySchema = z.object({
  name: z.string().min(1),
  link: z.string().url().nullable().optional().transform(v => v ?? null),
});

export const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  tech: z.string().min(1),
  link: z.string().url().nullable().optional(),
  liveLink: z.string().url().nullable().optional(),
  contributorIds: z.array(z.number().int()).nullable().optional(),
  awards: z.string().nullable().optional(),
  display: z.boolean(),
  date: z.string().datetime(),
  endDate: z.string().datetime().nullable().optional(),
  status: z.enum(['completed', 'wip', 'archived']),
  order: z.number().int().default(0),
});

export const experienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable().optional(),
  description: z.array(z.string()).min(1),
  tech: z.string().min(1),
  type: z.enum(['job', 'education', 'event']),
  order: z.number().int().default(0),
});

export const semesterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  order: z.number().int(),
});

export const subjectSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  passed: z.boolean(),
  credits: z.number().int().min(1),
  docPath: z.string().nullable().optional(),
  semesterId: z.string().min(1),
});

export const hobbySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().min(1),
  link: z.string().min(1),
  order: z.number().int().default(0),
});

// ─── ADVENTURES ──────────────────────────────────────────────────────────────

export const chronicleSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  coverImage: z.string().url().nullable().optional(),
});

export const passageSchema = z.object({
  title: z.string().min(1),
  content: z.string().nullable().optional(),
  order: z.number().int().default(0),
});

export const passageMediaSchema = z.object({
  url: z.string().url(),
  type: z.enum(['IMAGE', 'VIDEO', 'YOUTUBE']),
  order: z.number().int().default(0),
  caption: z.string().nullable().optional(),
});

export const subscriptionSchema = z.object({
  type: z.enum(['GLOBAL', 'CHRONICLE']),
  chronicleId: z.number().int().nullable().optional(),
});

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});
