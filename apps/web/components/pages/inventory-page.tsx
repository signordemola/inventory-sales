"use client";

import React, { useReducer } from "react";
import {
  useInventoryLevels,
  useInventoryHistory,
} from "@/hooks/use-inventory";

import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import { StatCard } from "@/components/inventory/stat-card";
import { StockLevelsTable } from "@/components/inventory/stock-levels-table";
import { ManualAdjustmentPanel } from "@/components/inventory/manual-adjustment-panel";
import { AuditTrailPanel } from "@/components/inventory/audit-trail-panel";
import {
  InventoryState,
  InventoryAction,
} from "@/components/inventory/inventory-types";

const initialState: InventoryState = {
  selectedLevel: null,
  movementType: "IN",
  quantity: "",
  reason: "",
  notes: "",
  levelSearch: "",
};

function inventoryReducer(
  state: InventoryState,
  action: InventoryAction,
): InventoryState {
  switch (action.type) {
    case "SET_LEVEL":
      return { ...state, selectedLevel: action.payload };
    case "SET_MOVEMENT":
      return { ...state, movementType: action.payload, reason: "" }; // Reset reason on movement type change
    case "SET_QUANTITY":
      return { ...state, quantity: action.payload };
    case "SET_REASON":
      return { ...state, reason: action.payload };
    case "SET_NOTES":
      return { ...state, notes: action.payload };
    case "SET_SEARCH":
      return { ...state, levelSearch: action.payload };
    case "RESET_FORM":
      return {
        ...state,
        selectedLevel: null,
        quantity: "",
        reason: "",
        notes: "",
      };
    default:
      return state;
  }
}

export function InventoryPageView() {
  const { data: levels, isLoading: loadingLevels } = useInventoryLevels();
  const { data: history, isLoading: loadingHistory } = useInventoryHistory();

  const [state, dispatch] = useReducer(inventoryReducer, initialState);

  // Summary stats
  const totalProducts = levels?.length ?? 0;
  const lowStock =
    levels?.filter(
      (l) => l.quantity > 0 && l.quantity <= l.product.lowStockThreshold,
    ).length ?? 0;
  const outOfStock = levels?.filter((l) => l.quantity === 0).length ?? 0;
  const totalUnits = levels?.reduce((s, l) => s + l.quantity, 0) ?? 0;

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 h-full overflow-y-auto bg-slate-50/30">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 font-display">
            Inventory & Stock Adjustments
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Monitor stock levels, make adjustments, and view the full audit
            trail.
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total SKUs"
          value={totalProducts}
          icon={<Package className="w-6 h-6 text-slate-600" />}
          color="bg-slate-100"
        />
        <StatCard
          label="Total Units"
          value={totalUnits.toLocaleString()}
          icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
          color="bg-emerald-50"
        />
        <StatCard
          label="Low Stock"
          value={lowStock}
          sub="below threshold"
          icon={<AlertTriangle className="w-6 h-6 text-amber-600" />}
          color="bg-amber-50"
        />
        <StatCard
          label="Out of Stock"
          value={outOfStock}
          icon={<TrendingDown className="w-6 h-6 text-red-500" />}
          color="bg-red-50"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">
        <StockLevelsTable
          levels={levels}
          loadingLevels={loadingLevels}
          state={state}
          dispatch={dispatch}
        />
        <ManualAdjustmentPanel state={state} dispatch={dispatch} />
      </div>

      <AuditTrailPanel history={history} loadingHistory={loadingHistory} />
    </div>
  );
}
