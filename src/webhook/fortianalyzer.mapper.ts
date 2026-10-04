import { mondayColumns, RELATED_ITEM_ID, REQUEST_TYPE_LABEL } from '../monday/columns.js';
import type { MondayColumnValues } from '../types.js';
import type { FortiAlert } from './fortianalyzer.schema.js';

export interface MondayItemDraft {
  itemName: string;
  columnValues: MondayColumnValues;
}

const SEVERITY_TO_PRIORITY: Record<string, string> = {
  low: 'P3 - Medium',
  medium: 'P3 - Medium',
  high: 'P2 - High',
  critical: 'P1 - Critical',
};

const NAME_LENGTH_LIMIT = 100;

// The envelope sends no serial field — it appears as logdev_id="FGT50GTK26017245"
// inside log-detail, and as DEVNAME[SERIAL] in the prose fields. Flat payloads
// send it outright, so prefer those and fall back to parsing.
const LOGDEV_ID = /logdev_id="([^"]+)"/i;
const BRACKETED_SERIAL = /\[([A-Za-z0-9]{6,})\]/;

/** Unresolved playbook variables arrive as "", so empty is the same as absent. */
function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return '';
}

function extractSerialNumber(alert: FortiAlert): string {
  const explicit = firstNonEmpty(alert.sn, alert.serial, alert.serialno);
  if (explicit) return explicit;

  const fromLogDetail = LOGDEV_ID.exec(alert['log-detail'] ?? '');
  if (fromLogDetail?.[1]) return fromLogDetail[1];

  for (const field of [alert.groupby2, alert.extrainfo, alert.subject, alert.message]) {
    const match = BRACKETED_SERIAL.exec(field ?? '');
    if (match?.[1]) return match[1];
  }

  return '';
}

function buildItemName(alert: FortiAlert, serialNumber: string): string {
  const named = firstNonEmpty(alert.subject, alert.device_name, alert.groupby1);
  if (named) return named;

  const fromMessage = firstNonEmpty(alert.message, alert.extrainfo);
  if (fromMessage) return fromMessage.slice(0, NAME_LENGTH_LIMIT);

  const identifier = firstNonEmpty(serialNumber, alert.alertid);
  return identifier ? `FortiAnalyzer alert ${identifier}` : 'FortiAnalyzer alert';
}

export function toMondayItemDraft(alert: FortiAlert): MondayItemDraft {
  const serialNumber = extractSerialNumber(alert);

  const columnValues: MondayColumnValues = {
    [mondayColumns.groupBy2]: { text: firstNonEmpty(alert.groupby2, alert.message, alert.extrainfo) },
    [mondayColumns.serialNumber]: serialNumber,
    [mondayColumns.requestType]: { label: REQUEST_TYPE_LABEL },
    [mondayColumns.relatedItem]: { item_ids: [RELATED_ITEM_ID] },
  };

  // An unrecognised severity is left unset rather than guessed — monday rejects
  // the whole mutation when a status label does not exist on the column.
  const priority = SEVERITY_TO_PRIORITY[firstNonEmpty(alert.severity).toLowerCase()];
  if (priority) {
    columnValues[mondayColumns.priority] = { label: priority };
  } else if (firstNonEmpty(alert.severity)) {
    console.warn(`[webhook] unmapped FortiAnalyzer severity "${alert.severity}" — priority left empty`);
  }

  return { itemName: buildItemName(alert, serialNumber), columnValues };
}
