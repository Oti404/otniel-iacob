import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

export interface AuthPayload {
  sub: number;
  email: string;
  type: 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/**
 * Verifies JWT Bearer token and attaches decoded payload to `req.user`.
 * Requires `type: 'admin'` in the payload — admin and subscriber tokens are
 * signed with different secrets, but this check is a second, independent
 * gate so a subscriber token can never be accepted here even if secrets
 * were ever mixed up.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as unknown as AuthPayload;
    if (payload.type !== 'admin') {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
}
