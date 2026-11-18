import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { prisma } from '@monorepo/database';

/**
 * Resolves the Google subscriber from the `subscriber_token` cookie.
 * Returns null for a missing, invalid, expired or non-subscriber token.
 */
export async function getSubscriber(req: Request) {
  const token = req.cookies?.subscriber_token;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SUBSCRIBER_SECRET!) as { sub: string; type: string };
    if (payload.type !== 'subscriber') return null;
    return await prisma.googleSubscriber.findUnique({ where: { googleId: payload.sub } });
  } catch {
    return null;
  }
}
