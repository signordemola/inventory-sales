import React from "react";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  SlidersHorizontal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { StockMovementType, useAdjustStock } from "@/hooks/use-inventory";
import { InventoryState, InventoryAction } from "./inventory-types";

export const MOVEMENT_TYPES: {
  value: StockMovementType;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    value: "IN",
    label: "Stock In",
    icon: <ArrowUpCircle className="w-4 h-4" />,
    color:
      "text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
  },
  {
    value: "OUT",
    label: "Stock Out",
    icon: <ArrowDownCircle className="w-4 h-4" />,
    color: "text-red-600 bg-red-50 border-red-200 hover:bg-red-100",
  },
  {
    value: "ADJUSTMENT",
    label: "Adjustment",
    icon: <SlidersHorizontal className="w-4 h-4" />,
    color: "text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100",
  },
];

export const REASON_OPTIONS: Record<StockMovementType, string[]> = {
  IN: ["Purchase Order", "Return from Customer", "Transfer In", "Other"],
  OUT: ["Damaged Goods", "Expired", "Theft", "Transfer Out", "Other"],
  ADJUSTMENT: ["Correction", "Count Discrepancy", "System Error", "Other"],
};

export function ManualAdjustmentPanel({
  state,
  dispatch,
}: {
  state: InventoryState;
  dispatch: React.Dispatch<InventoryAction>;
}) {
  const adjustStock = useAdjustStock();

  const handleAdjust = async () => {
    if (!state.selectedLevel) return toast.error("Select a product first");
    const qty = parseInt(state.quantity, 10);
    if (!qty || qty < 1) return toast.error("Enter a valid quantity");

    try {
      await adjustStock.mutateAsync({
        productId: state.selectedLevel.productId,
        type: state.movementType,
        quantity: qty,
        reason: state.reason || undefined,
      });
      toast.success("Stock adjustment saved");
      dispatch({ type: "RESET_FORM" });
    } catch {
      toast.error("Failed to save adjustment");
    }
  };

  return (
    <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 dark:border-slate-800 shadow-none">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-bold text-slate-900">Manual Adjustment</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {state.selectedLevel
            ? `Adjusting: ${state.selectedLevel.product.name}`
            : "Select a product from the table"}
        </p>
      </div>

      <div className="p-5 space-y-5">
        {/* Selected product summary */}
        {state.selectedLevel ? (
          <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Current Stock
              </p>
              <p className="text-3xl font-black text-slate-900 mt-0.5">
                {state.selectedLevel.quantity.toLocaleString()}
                <span className="text-base font-semibold text-slate-400 ml-1">
                  units
                </span>
              </p>
            </div>
            <button
              className="text-xs text-slate-400 hover:text-slate-600 underline"
              onClick={() => dispatch({ type: "SET_LEVEL", payload: null })}
            >
              Clear
            </button>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-center h-[84px]">
            <p className="text-sm text-slate-400 font-medium">
              ← Click a product to select it
            </p>
          </div>
        )}

        {/* Action toggle */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
            Action
          </label>
          <div className="flex gap-2">
            {MOVEMENT_TYPES.map((m) => (
              <button
                key={m.value}
                onClick={() =>
                  dispatch({ type: "SET_MOVEMENT", payload: m.value })
                }
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-all",
                  state.movementType === m.value
                    ? m.color
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50",
                )}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
            Quantity
          </label>
          <Input
            type="number"
            min={1}
            placeholder="0"
            className="h-11 text-lg font-bold text-center border-slate-200"
            value={state.quantity}
            onChange={(e) =>
              dispatch({ type: "SET_QUANTITY", payload: e.target.value })
            }
          />
        </div>

        {/* Reason */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
            Reason Code
          </label>
          <div className="grid grid-cols-2 gap-2">
            {REASON_OPTIONS[state.movementType].map((r) => (
              <button
                key={r}
                onClick={() => dispatch({ type: "SET_REASON", payload: r })}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs font-semibold border text-left transition-all",
                  state.reason === r
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
            Notes (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Add specific details about the reason..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            value={state.notes}
            onChange={(e) =>
              dispatch({ type: "SET_NOTES", payload: e.target.value })
            }
          />
        </div>

        <Button
          className="w-full h-11 rounded-xl font-bold text-sm bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
          disabled={
            !state.selectedLevel || !state.quantity || adjustStock.isPending
          }
          onClick={handleAdjust}
        >
          {adjustStock.isPending ? "Saving..." : "Save Adjustment"}
        </Button>
      </div>
    </div>
  );
}
