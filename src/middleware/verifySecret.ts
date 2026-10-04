import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { config } from '../config.js';
import { HttpError } from '../errors.js';

const expected = Buffer.from(config.WEBHOOK_SECRET);

export function verifySecret(req: Request, _res: Response, next: NextFunction): void {
  const header = req.get('x-webhook-secret') ?? '';
  const received = Buffer.from(header);

  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    next(new HttpError(401, 'Invalid or missing x-webhook-secret header'));
    return;
  }

  next();
}
