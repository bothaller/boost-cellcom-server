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

// FortiAnalyzer sends no serial-number field. The serial appears as
// logdev_id="FGT50GTK26017245" inside log-detail, and as DEVNAME[SERIAL] in the
// prose fields, so try the structured form first and fall back to the brackets.
const LOGDEV_ID = /logdev_id="([^"]+)"/i;
const BRACKETED_SERIAL = /\[([A-Za-z0-9]{6,})\]/;

function extractSerialNumber(alert: FortiAlert): string {
  const logDetail = alert['log-detail'] ?? '';
  const fromLogDetail = LOGDEV_ID.exec(logDetail);
  if (fromLogDetail?.[1]) return fromLogDetail[1];

  for (const field of [alert.groupby2, alert.extrainfo, alert.subject]) {
    const match = BRACKETED_SERIAL.exec(field ?? '');
    if (match?.[1]) return match[1];
  }

  return '';
}

export function toMondayItemDraft(alert: FortiAlert): MondayItemDraft {
  const itemName = alert.subject?.trim() || `FortiAnalyzer alert ${alert.alertid ?? ''}`.trim();

  const columnValues: MondayColumnValues = {
    [mondayColumns.groupBy2]: { text: alert.groupby2 ?? '' },
    [mondayColumns.serialNumber]: extractSerialNumber(alert),
    [mondayColumns.requestType]: { label: REQUEST_TYPE_LABEL },
    [mondayColumns.relatedItem]: { item_ids: [RELATED_ITEM_ID] },
  };

  // An unrecognised severity is left unset rather than guessed — monday rejects
  // the whole mutation when a status label does not exist on the column.
  const priority = SEVERITY_TO_PRIORITY[(alert.severity ?? '').trim().toLowerCase()];
  if (priority) {
    columnValues[mondayColumns.priority] = { label: priority };
  } else if (alert.severity) {
    console.warn(`[webhook] unmapped FortiAnalyzer severity "${alert.severity}" — priority left empty`);
  }

  return { itemName, columnValues };
}
