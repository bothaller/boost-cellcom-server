import { config } from '../config.js';
import type { MondayColumnValues, MondayItem } from '../types.js';
import { mondayRequest } from './client.js';

const CREATE_ITEM = `
  mutation CreateItem($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
    create_item(
      board_id: $boardId
      item_name: $itemName
      column_values: $columnValues
    ) {
      id
      name
    }
  }
`;

export async function createItem(
  itemName: string,
  columnValues: MondayColumnValues,
): Promise<MondayItem> {
  const data = await mondayRequest<{ create_item: MondayItem }>(CREATE_ITEM, {
    boardId: config.MONDAY_BOARD_ID,
    itemName,
    columnValues: JSON.stringify(columnValues),
  });

  return data.create_item;
}
