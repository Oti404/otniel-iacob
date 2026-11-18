import { Request } from 'express';
import { ZodTypeAny, z } from 'zod';
import { badRequest } from './http-error';

/** Validates `body` against `schema`; throws 400 with the first Zod message. */
export function parseBody<S extends ZodTypeAny>(schema: S, body: unknown): z.infer<S> {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw badRequest(parsed.error.errors[0]?.message ?? 'Validation error');
  }
  return parsed.data;
}

/** Parses a positive integer route param (`:id` by default); throws 400 otherwise. */
export function parseId(req: Request, param = 'id'): number {
  const raw = String(req.params[param]);
  const n = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(n) || n < 1) {
    throw badRequest(`Invalid ${param}`);
  }
  return n;
}
