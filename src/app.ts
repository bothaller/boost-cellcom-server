import express from 'express';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { parseAnyBody } from './middleware/parseAnyBody.js';
import { requestLogger } from './middleware/requestLogger.js';
import { webhookRouter } from './webhook/webhook.routes.js';

export function createApp(): express.Express {
  const app = express();

  app.disable('x-powered-by');

  // `type: () => true` forces the body to be buffered whatever the Content-Type
  // is — including when the caller sends none. parseAnyBody then decodes it.
  app.use(express.raw({ type: () => true, limit: '2mb' }));
  app.use(parseAnyBody);
  app.use(requestLogger);

  app.get('/health', (_req, res) => {
    res.json({ ok: true, uptime: process.uptime() });
  });

  app.use('/webhooks', webhookRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
