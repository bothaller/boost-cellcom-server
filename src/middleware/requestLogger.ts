import type { NextFunction, Request, Response } from 'express';

const REDACTED = new Set(['x-webhook-secret', 'authorization', 'cookie', 'proxy-authorization']);
const BODY_LOG_LIMIT = 4000;

export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  // monday code polls /health constantly — logging it buries the real traffic.
  if (req.path === '/health') {
    next();
    return;
  }

  const headers = Object.entries(req.headers)
    .map(([key, value]) => `${key}=${REDACTED.has(key) ? '<redacted>' : String(value)}`)
    .join(' ');

  console.log(
    `[req] ${req.method} ${req.originalUrl} content-type="${req.get('content-type') ?? '(none)'}" bytes=${req.rawBody.length}`,
  );
  console.log(`[req] headers ${headers}`);
  console.log(
    `[req] body ${req.rawBody === '' ? '(EMPTY — no bytes received)' : req.rawBody.slice(0, BODY_LOG_LIMIT)}`,
  );

  next();
}
