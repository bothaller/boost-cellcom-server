import { config } from '../config.js';
import { createItem } from '../monday/items.repository.js';
import type { CreatedItem } from '../types.js';
import { toMondayItemDraft } from './fortianalyzer.mapper.js';
import type { FortiAlert } from './fortianalyzer.schema.js';

/** One notification can carry several alerts; each becomes its own item. */
export async function createItemsFromAlerts(alerts: FortiAlert[]): Promise<CreatedItem[]> {
  const created: CreatedItem[] = [];

  for (const alert of alerts) {
    const { itemName, columnValues } = toMondayItemDraft(alert);
    const item = await createItem(itemName, columnValues);
    created.push({ itemId: item.id, name: item.name, boardId: config.MONDAY_BOARD_ID });
  }

  return created;
}
