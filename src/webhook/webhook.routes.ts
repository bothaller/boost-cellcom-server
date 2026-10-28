import { Router } from 'express';
import { verifySecret } from '../middleware/verifySecret.js';
import { createItemsFromAlerts } from './create-items.service.js';
import { extractAlerts, fortiPayloadSchema } from './fortianalyzer.schema.js';

export const webhookRouter = Router();

webhookRouter.post('/message', verifySecret, async (req, res) => {
  // Single line, logged before any parsing: monday code's log viewer interleaves
  // multi-line output, so one self-contained line is what survives correlation.
  console.log(
    `[webhook] PAYLOAD RECEIVED (${req.rawBody.length} bytes): ${req.rawBody === '' ? '(EMPTY — sender transmitted no body)' : req.rawBody}`,
  );

  const parsed = fortiPayloadSchema.safeParse(req.body);

  if (!parsed.success) {
    const reason =
      req.rawBody === ''
        ? 'the request carried no body — the sender transmitted 0 bytes'
        : typeof req.body === 'string'
          ? 'the body was not valid JSON'
          : 'the body is JSON but carries none of the fields needed to build a ticket (serial / subject / message / device_name / severity, or a fortianalyzer_notification envelope)';

    console.warn(`===== NO TICKET CREATED ===============================`);
    console.warn(`  reason  ${reason}`);
    console.warn(`  action  responded 200 so the caller's task does not fail`);
    console.warn(`=======================================================`);

    // Deliberately 200, not 400: a malformed payload is the sender's
    // misconfiguration, and failing their task buries the diagnosis. The full
    // request is logged above instead, and the reason is echoed back to them.
    res.status(200).json({
      ok: true,
      created: 0,
      ignored: true,
      reason,
      received: {
        contentType: req.get('content-type') ?? null,
        bodyBytes: req.rawBody.length,
        body: req.rawBody.slice(0, 500),
      },
      expected: {
        envelope: 'fortianalyzer_notification.data[] with subject, groupby2, severity',
        flat: 'any of sn / serial / serialno, subject, message, device_name, severity',
      },
    });
    return;
  }

  const alerts = extractAlerts(parsed.data);
  const shape = 'fortianalyzer_notification' in parsed.data ? 'envelope' : 'flat';
  console.log(`[webhook] accepted ${alerts.length} alert(s) (${shape}): ${alerts.map((a) => a.alertid ?? '(no alertid)').join(', ')}`);

  const created = await createItemsFromAlerts(alerts);
  console.log(`[webhook] created ${created.length} item(s): ${created.map((c) => c.itemId).join(', ')}`);

  res.status(201).json({ ok: true, count: created.length, created });
});
