import { Router } from 'express';
import { HttpError } from '../errors.js';
import { verifySecret } from '../middleware/verifySecret.js';
import { createItemsFromNotification } from './create-items.service.js';
import { fortiNotificationSchema } from './fortianalyzer.schema.js';

export const webhookRouter = Router();

webhookRouter.post('/message', verifySecret, async (req, res) => {
  const parsed = fortiNotificationSchema.safeParse(req.body);

  if (!parsed.success) {
    // Distinguish "nothing arrived" from "something arrived in the wrong shape" —
    // they have completely different causes (caller/transport vs. payload format).
    const reason =
      req.rawBody === ''
        ? 'request body was empty — no bytes received'
        : typeof req.body === 'string'
          ? 'body was not valid JSON'
          : 'body parsed but has no fortianalyzer_notification.data';

    console.warn(`[webhook] rejected: ${reason}`);

    throw new HttpError(400, `Not a FortiAnalyzer notification: ${reason}`, {
      contentType: req.get('content-type') ?? null,
      bodyBytes: req.rawBody.length,
      bodyPreview: req.rawBody.slice(0, 500),
      issues: parsed.error.flatten(),
    });
  }

  const alerts = parsed.data.fortianalyzer_notification.data;
  console.log(`[webhook] accepted ${alerts.length} alert(s): ${alerts.map((a) => a.alertid ?? '(no alertid)').join(', ')}`);

  const created = await createItemsFromNotification(parsed.data);
  console.log(`[webhook] created ${created.length} item(s): ${created.map((c) => c.itemId).join(', ')}`);

  res.status(201).json({ ok: true, count: created.length, created });
});
