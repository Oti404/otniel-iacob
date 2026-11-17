/**
 * Thrown from route handlers and services; the global error handler turns it
 * into `{ message }` with the given status. Express 5 forwards rejected async
 * handlers to that handler, so routes don't need their own try/catch.
 */
export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (message: string) => new HttpError(400, message);
export const notFound = (what: string) => new HttpError(404, `${what} not found`);
export const serviceUnavailable = (message: string) => new HttpError(503, message);
