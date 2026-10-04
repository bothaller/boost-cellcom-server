import type { NextFunction, Request, Response } from 'express';
import { config } from '../config.js';
import { HttpError } from '../errors.js';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = err instanceof HttpError ? err.status : 500;
  const message = err instanceof Error ? err.message : 'Internal server error';

  console.error(`[error] ${req.method} ${req.originalUrl} -> ${status}: ${message}`, err);

  res.status(status).json({
    ok: false,
    error: message,
    ...(config.NODE_ENV !== 'production' && err instanceof HttpError && err.details !== undefined
      ? { details: err.details }
      : {}),
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ ok: false, error: `No route for ${req.method} ${req.originalUrl}` });
}
