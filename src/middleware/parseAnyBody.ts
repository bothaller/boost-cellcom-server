import type { NextFunction, Request, Response } from 'express';

/**
 * Runs after express.raw() has buffered the body under any Content-Type.
 * Matching parsers by Content-Type is not safe here: FortiAnalyzer (and Postman
 * with a non-JSON body type) can send no Content-Type at all, in which case
 * type-is rejects every parser and req.body silently stays undefined.
 */
export function parseAnyBody(req: Request, _res: Response, next: NextFunction): void {
  req.rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';

  if (req.rawBody === '') {
    req.body = undefined;
    next();
    return;
  }

  if ((req.get('content-type') ?? '').includes('application/x-www-form-urlencoded')) {
    req.body = Object.fromEntries(new URLSearchParams(req.rawBody));
    next();
    return;
  }

  try {
    req.body = JSON.parse(req.rawBody);
  } catch {
    req.body = req.rawBody;
  }

  next();
}
