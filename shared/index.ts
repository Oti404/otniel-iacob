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

// ─── API RESPONSES ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// ─── SCHEMAS ─────────────────────────────────────────────────────────────────

export * from './schemas';
