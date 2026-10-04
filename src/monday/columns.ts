/**
 * Board column ids. These are board structure, not deployment config — they only
 * change when the board itself changes, so they live in code rather than env.
 */
export const mondayColumns = {
  /** Long Text — FortiAnalyzer `groupby2` (the human-readable alert detail). */
  groupBy2: 'long_text7',
  /** Text — device serial, parsed out of the alert text (FortiAnalyzer sends no serial field). */
  serialNumber: 'text',
  /** Status — mapped from FortiAnalyzer `severity`. */
  priority: 'priority',
  /** Status — always set to REQUEST_TYPE_LABEL. */
  requestType: 'request_type',
  /** Connect Boards — always linked to RELATED_ITEM_ID. */
  relatedItem: 'board_relation_mm3hvtdh',
} as const;

/** Every FortiAnalyzer-sourced ticket carries this request type. */
export const REQUEST_TYPE_LABEL = 'Fortianalyzer Issue';

/** https://cellcom198012.monday.com/boards/5096239596/pulses/2907458168 */
export const RELATED_ITEM_ID = 2907458168;
