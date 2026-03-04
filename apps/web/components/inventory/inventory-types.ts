import { StockLevel, StockMovementType } from "@/hooks/use-inventory";

export type InventoryState = {
  selectedLevel: StockLevel | null;
  movementType: StockMovementType;
  quantity: string;
  reason: string;
  notes: string;
  levelSearch: string;
};

export type InventoryAction =
  | { type: "SET_LEVEL"; payload: StockLevel | null }
  | { type: "SET_MOVEMENT"; payload: StockMovementType }
  | { type: "SET_QUANTITY"; payload: string }
  | { type: "SET_REASON"; payload: string }
  | { type: "SET_NOTES"; payload: string }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "RESET_FORM" };
