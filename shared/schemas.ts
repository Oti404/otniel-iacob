import { z } from 'zod';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Required single-line or multi-line text with an upper bound. */
const text = (max: number) => z.string().min(1).max(max);

/** Absolute http(s) URL. Blocks javascript:, data: and other schemes in rendered links. */
const webUrl = z.string().url().max(500).refine(
  v => /^https?:\/\//i.test(v),
  'URL must start with http:// or https://',
);

const optionalText = (max: number) => z.string().max(max).nullable().optional();

export const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(200),
});

export const profileSchema = z.object({
  name: text(100),
  role: text(100),
  description: text(1000),
  headline: z.string().max(200).nullable().optional().transform(v => v ?? null),
  quote: z.string().max(500).nullable().optional().transform(v => v ?? null),
  quoteAuthor: z.string().max(100).nullable().optional().transform(v => v ?? null),
  photo: text(500),
  avatar: text(500),
  cvPdf: text(500),
  location: text(100),
  email: z.string().email().max(254),
  linkedin: webUrl,
  github: webUrl,
});

export const contributorEntitySchema = z.object({
  name: text(100),
  link: webUrl.nullable().optional().transform(v => v ?? null),
});

export const projectSchema = z.object({
  name: text(200),
  description: text(4000),
  tech: text(500),
  link: webUrl.nullable().optional(),
  liveLink: webUrl.nullable().optional(),
  contributorIds: z.array(z.number().int()).nullable().optional(),
  awards: optionalText(500),
  display: z.boolean(),
  date: z.string().datetime(),
  endDate: z.string().datetime().nullable().optional(),
  status: z.enum(['completed', 'wip', 'archived']),
  order: z.number().int().default(0),
});

export const experienceSchema = z.object({
  company: text(200),
  role: text(200),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable().optional(),
  description: z.array(z.string().max(1000)).min(1).max(30),
  tech: text(500),
  type: z.enum(['job', 'education', 'event']),
  order: z.number().int().default(0),
});

export const semesterSchema = z.object({
  id: text(50),
  name: text(100),
  order: z.number().int(),
});

export const subjectSchema = z.object({
  code: text(50),
  name: text(200),
  passed: z.boolean(),
  credits: z.number().int().min(1),
  docPath: optionalText(500),
  semesterId: text(50),
});

export const hobbySchema = z.object({
  name: text(100),
  description: text(1000),
  icon: text(100),
  link: text(500),
  order: z.number().int().default(0),
});

// ─── ADVENTURES ──────────────────────────────────────────────────────────────

export const chronicleSchema = z.object({
  title: text(200),
  description: optionalText(2000),
  coverImage: webUrl.nullable().optional(),
});

export const passageSchema = z.object({
  title: text(200),
  content: optionalText(100_000),
  order: z.number().int().default(0),
});

export const passageMediaSchema = z.object({
  url: webUrl,
  type: z.enum(['IMAGE', 'VIDEO', 'YOUTUBE']),
  order: z.number().int().default(0),
  caption: optionalText(500),
});

export const publishedAtSchema = z.object({
  publishedAt: z.coerce.date(),
});

export const subscriptionSchema = z.object({
  type: z.enum(['GLOBAL', 'CHRONICLE']),
  chronicleId: z.number().int().nullable().optional(),
});

// Browser push services. Anything else would let a subscriber make the server
// POST to an arbitrary URL (internal Docker hosts, cloud metadata) on publish.
const PUSH_HOST_SUFFIXES = [
  'fcm.googleapis.com',
  'push.services.mozilla.com',
  'notify.windows.com',
  'push.apple.com',
];

export function isAllowedPushEndpoint(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.port !== '') return false;
    const host = url.hostname.toLowerCase();
    return PUSH_HOST_SUFFIXES.some(s => host === s || host.endsWith('.' + s));
  } catch {
    return false;
  }
}

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url().max(1000).refine(isAllowedPushEndpoint, 'Unsupported push service'),
  p256dh: z.string().min(1).max(200),
  auth: z.string().min(1).max(100),
});
