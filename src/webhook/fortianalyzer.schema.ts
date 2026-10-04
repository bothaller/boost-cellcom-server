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
  })
  .passthrough();

export const fortiNotificationSchema = z
  .object({
    fortianalyzer_notification: z
      .object({
        data: z.array(fortiAlertSchema).default([]),
      })
      .passthrough(),
  })
  .passthrough();

export type FortiAlert = z.infer<typeof fortiAlertSchema>;
export type FortiNotification = z.infer<typeof fortiNotificationSchema>;
