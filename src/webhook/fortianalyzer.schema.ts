import { z } from 'zod';

/**
 * Only the fields we map are described; `passthrough` keeps the rest of the
 * FortiAnalyzer alert intact so unmapped fields still reach the raw log.
 */
export const fortiAlertSchema = z
  .object({
    alertid: z.string().optional(),
    subject: z.string().optional(),
    groupby1: z.string().optional(),
    groupby2: z.string().optional(),
    severity: z.string().optional(),
    extrainfo: z.string().optional(),
    'log-detail': z.string().optional(),
    // Hand-built playbook payloads carry these instead of the envelope fields.
    // The serial arrives under three different spellings depending on who
    // configured the action, so all three are accepted.
    sn: z.string().optional(),
    serial: z.string().optional(),
    serialno: z.string().optional(),
    device_name: z.string().optional(),
    message: z.string().optional(),
  })
  .passthrough();

/** Event Handler → Notification → Generic Webhook shape. */
export const fortiNotificationSchema = z
  .object({
    fortianalyzer_notification: z
      .object({
        data: z.array(fortiAlertSchema).default([]),
      })
      .passthrough(),
  })
  .passthrough();

/**
 * A flat alert is one unwrapped object. Every field is optional, so without this
 * guard the schema would match any JSON at all and happily create blank tickets.
 */
const FLAT_KEYS = ['sn', 'serial', 'serialno', 'subject', 'message', 'device_name', 'severity'] as const;

export const flatAlertSchema = fortiAlertSchema.refine(
  (alert) => FLAT_KEYS.some((key) => typeof alert[key] === 'string' && alert[key] !== ''),
  { message: `expected at least one non-empty field of: ${FLAT_KEYS.join(', ')}` },
);

export const fortiPayloadSchema = z.union([fortiNotificationSchema, flatAlertSchema]);

export type FortiAlert = z.infer<typeof fortiAlertSchema>;
export type FortiNotification = z.infer<typeof fortiNotificationSchema>;
export type FortiPayload = z.infer<typeof fortiPayloadSchema>;

// Both union members carry a passthrough index signature, so a bare `in` check
// narrows to `unknown`. The payload is already validated at this point.
function isNotification(payload: FortiPayload): payload is FortiNotification {
  return 'fortianalyzer_notification' in payload;
}

/** Both accepted shapes reduce to a list of alerts, one monday item each. */
export function extractAlerts(payload: FortiPayload): FortiAlert[] {
  return isNotification(payload) ? payload.fortianalyzer_notification.data : [payload];
}
