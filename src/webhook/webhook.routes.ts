import { Router } from 'express';
import { HttpError } from '../errors.js';
import { verifySecret } from '../middleware/verifySecret.js';
import { createItemsFromAlerts } from './create-items.service.js';
import { extractAlerts, fortiPayloadSchema } from './fortianalyzer.schema.js';

export const webhookRouter = Router();

webhookRouter.post('/message', verifySecret, async (req, res) => {
  const parsed = fortiPayloadSchema.safeParse(req.body);

  if (!parsed.success) {
    // Distinguish "nothing arrived" from "something arrived in the wrong shape" —
    // they have completely different causes (caller/transport vs. payload format).
    const reason =
      req.rawBody === ''
        ? 'request body was empty — no bytes received'
        : typeof req.body === 'string'
          ? 'body was not valid JSON'
          : 'body is JSON but matches neither the fortianalyzer_notification envelope nor a flat alert';

    console.warn(`[webhook] rejected: ${reason}`);

    throw new HttpError(400, `Not a FortiAnalyzer notification: ${reason}`, {
      contentType: req.get('content-type') ?? null,
      bodyBytes: req.rawBody.length,
      bodyPreview: req.rawBody.slice(0, 500),
      issues: parsed.error.flatten(),
    });
  }

  const alerts = extractAlerts(parsed.data);
  const shape = 'fortianalyzer_notification' in parsed.data ? 'envelope' : 'flat';
  console.log(`[webhook] accepted ${alerts.length} alert(s) (${shape}): ${alerts.map((a) => a.alertid ?? '(no alertid)').join(', ')}`);

  const created = await createItemsFromAlerts(alerts);
  console.log(`[webhook] created ${created.length} item(s): ${created.map((c) => c.itemId).join(', ')}`);

  res.status(201).json({ ok: true, count: created.length, created });
});
