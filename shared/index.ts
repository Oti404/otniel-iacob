// ─── HEALTH ──────────────────────────────────────────────────────────────────

export interface HealthStatus {
  status: string;
  message: string;
  database: string;
  timestamp: string;
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
}

// ─── CONTENT ─────────────────────────────────────────────────────────────────

export interface Profile {
  id: number;
  name: string;
  role: string;
  description: string;
  headline?: string | null;
  quote?: string | null;
  quoteAuthor?: string | null;
  photo: string;
  avatar: string;
  cvPdf: string;
  location: string;
  email: string;
  linkedin: string;
  github: string;
}

export interface Contributor {
  id: number;
  name: string;
  link?: string | null;
}

export type ProjectStatus = 'completed' | 'wip' | 'archived';

export interface Project {
  id: number;
  name: string;
  description: string;
  tech: string;
  link?: string | null;
  liveLink?: string | null;
  contributors?: Contributor[] | null;
  awards?: string | null;
  display: boolean;
  date: string;
  endDate?: string | null;
  status: ProjectStatus;
  order: number;
}

export type ExperienceType = 'job' | 'education' | 'event';

export interface Experience {
  id: number;
  company: string;
  role: string;
  startDate: string;
  endDate?: string | null;
  description: string[];
  tech: string;
  type: ExperienceType;
  order: number;
}

export interface Subject {
  id: number;
  code: string;
  name: string;
  passed: boolean;
  credits: number;
  docPath?: string | null;
  semesterId: string;
}

export interface Semester {
  id: string;
  name: string;
  order: number;
  subjects: Subject[];
}

export interface Hobby {
  id: number;
  name: string;
  description: string;
  icon: string;
  link: string;
  order: number;
}

// ─── ADVENTURES ──────────────────────────────────────────────────────────────

export type MediaType = 'IMAGE' | 'VIDEO' | 'YOUTUBE';
export type SubscriptionType = 'GLOBAL' | 'CHRONICLE';

export interface PassageMedia {
  id: number;
  passageId: number;
  url: string;
  cloudinaryId?: string | null;
  type: MediaType;
  order: number;
  caption?: string | null;
}

export interface Passage {
  id: number;
  chronicleId: number;
  title: string;
  content?: string | null;
  order: number;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  media: PassageMedia[];
}

export interface Chronicle {
  id: number;
  title: string;
  description?: string | null;
  coverImage?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  passages?: Passage[];
}

// ─── SUBSCRIBERS ─────────────────────────────────────────────────────────────

export interface GoogleSubscriber {
  id: number;
  googleId: string;
  email: string;
  name: string;
  picture?: string | null;
  createdAt: string;
}

export interface Subscription {
  id: number;
  subscriberId: number;
  type: SubscriptionType;
  chronicleId?: number | null;
  createdAt: string;
}

export interface PushSubscription {
  id: number;
  subscriberId: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
}

export interface SubscriberTokenPayload {
  sub: string;
  email: string;
}

// ─── API RESPONSES ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// ─── SCHEMAS ─────────────────────────────────────────────────────────────────

export * from './schemas';
