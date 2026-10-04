export interface MondayItem {
  id: string;
  name: string;
}

export interface CreatedItem {
  itemId: string;
  name: string;
  boardId: string;
}

export type MondayColumnValues = Record<string, unknown>;
