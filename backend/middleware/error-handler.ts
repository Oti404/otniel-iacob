import { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import { Prisma } from '@monorepo/database';
import { HttpError } from '../lib/http-error';

/**
 * The one place errors become HTTP responses. Never sends stack traces.
 *   HttpError         → its own status + message
 *   Prisma P2025      → 404 (update/delete on a missing row)
 *   Prisma P2002      → 409 (unique constraint)
 *   Prisma P2003      → 400 (foreign key points nowhere)
 *   Multer size limit → 413
 *   Body too large    → 413, malformed JSON → 400
 *   anything else     → 500, logged
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') { res.status(404).json({ message: 'Not found' }); return; }
    if (err.code === 'P2002') { res.status(409).json({ message: 'Already exists' }); return; }
    if (err.code === 'P2003') { res.status(400).json({ message: 'Related record not found' }); return; }
  }

  if (err instanceof MulterError) {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    res.status(status).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'File too large' : 'Invalid upload' });
    return;
  }

  const type = (err as { type?: string }).type;
  if (type === 'entity.too.large') { res.status(413).json({ message: 'Request body too large' }); return; }
  if (type === 'entity.parse.failed') { res.status(400).json({ message: 'Malformed JSON' }); return; }

  console.error(`[${req.method} ${req.originalUrl}]`, err);
  res.status(500).json({ message: 'Internal server error' });
}
