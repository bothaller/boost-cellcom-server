import type { NextFunction, Request, Response } from 'express';

const REDACTED = new Set(['x-webhook-secret', 'authorization', 'cookie', 'proxy-authorization']);
const NOISE = new Set([
  'x-serverless-authorization',
  'cf-ray',
  'cf-visitor',
  'cdn-loop',
  'x-cloud-trace-context',
  'traceparent',
  'forwarded',
  'via',
  'accept-encoding',
  'accept',
]);
const BODY_LOG_LIMIT = 8000;

/**
 * Logged as one delimited block so a single inbound request can be screenshotted
 * or pasted as-is when showing the sender's owner what they actually sent.
 * Infrastructure headers added by Cloudflare/Cloud Run are dropped — they bury
 * the three lines that matter (content-type, content-length, user-agent).
 */
export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  // monday code polls /health constantly — logging it buries the real traffic.
  if (req.path === '/health') {
    next();
    return;
  }

  const headers = Object.entries(req.headers)
    .filter(([key]) => !NOISE.has(key))
    .map(([key, value]) => `    ${key}: ${REDACTED.has(key) ? '<redacted>' : String(value)}`)
    .join('\n');

  console.log(
    [
      '===== INBOUND REQUEST =================================',
      `  time         ${new Date().toISOString()}`,
      `  request      ${req.method} ${req.originalUrl}`,
      `  from         ${req.get('user-agent') ?? '(no user-agent)'}`,
      `  client ip    ${req.get('cf-connecting-ip') ?? req.ip ?? '(unknown)'}`,
      `  content-type ${req.get('content-type') ?? '(NONE SENT)'}`,
      `  body bytes   ${req.rawBody.length}`,
      '  headers',
      headers,
      '  body',
      req.rawBody === ''
        ? '    (EMPTY — the sender transmitted no body at all)'
        : req.rawBody.slice(0, BODY_LOG_LIMIT).replace(/^/gm, '    '),
      '=======================================================',
    ].join('\n'),
  );

  next();
}
