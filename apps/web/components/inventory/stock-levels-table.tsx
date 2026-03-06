import React from "react";
import Image from "next/image";
import { Search, Package, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { StockLevel } from "@/hooks/use-inventory";
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InventoryState, InventoryAction } from "./inventory-types";

export function StockLevelsTable({
  levels,
  loadingLevels,
  state,
  dispatch,
}: {
  levels: StockLevel[] | undefined;
  loadingLevels: boolean;
  state: InventoryState;
  dispatch: React.Dispatch<InventoryAction>;
}) {
  const filteredLevels = levels?.filter(
    (l) =>
      l.product.name.toLowerCase().includes(state.levelSearch.toLowerCase()) ||
      (l.product.sku ?? "")
        .toLowerCase()
        .includes(state.levelSearch.toLowerCase()),
  );

  return (
    <div className="xl:col-span-3 bg-white rounded-xl border border-slate-200 dark:border-slate-800 shadow-none overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
        <h2 className="font-bold text-slate-900">Stock Levels</h2>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            placeholder="Search product or SKU..."
            className="pl-8 h-8 text-sm bg-slate-50 border-slate-200 rounded-lg"
            value={state.levelSearch}
            onChange={(e) =>
              dispatch({ type: "SET_SEARCH", payload: e.target.value })
            }
          />
        </div>
      </div>

      <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
        {loadingLevels ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-5 py-3 flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16 rounded-md" />
            </div>
          ))
        ) : filteredLevels?.length === 0 ? (
          <div className="py-12">
            <Empty>
              <EmptyMedia>
                <Package className="w-6 h-6 text-slate-400" />
              </EmptyMedia>
              <EmptyTitle>No products found</EmptyTitle>
            </Empty>
          </div>
        ) : (
          filteredLevels?.map((level) => {
            const isLow =
              level.quantity > 0 &&
              level.quantity <= level.product.lowStockThreshold;
            const isOut = level.quantity === 0;
            const isSelected = state.selectedLevel?.id === level.id;

            return (
              <button
                key={level.id}
                className={cn(
                  "w-full px-5 py-3 flex items-center gap-3 text-left transition-colors",
                  isSelected
                    ? "bg-primary/5 border-r-2 border-primary"
                    : "hover:bg-slate-50",
                )}
                onClick={() =>
                  dispatch({
                    type: "SET_LEVEL",
                    payload: isSelected ? null : level,
                  })
                }
              >
                {/* Image / Icon */}
                <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden relative shrink-0 flex items-center justify-center">
                  {level.product.images?.[0] ? (
                    <Image
                      src={level.product.images[0]}
                      alt={level.product.name}
                      width={36}
                      height={36}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <Package className="w-4 h-4 text-slate-300" />
                  )}
                </div>

                {/* Name + SKU */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900 truncate">
                    {level.product.name}
                  </p>
                  {level.product.sku && (
                    <p className="text-[11px] text-slate-400">
                      SKU: {level.product.sku}
                    </p>
                  )}
                </div>

                {/* Stock qty */}
                <div className="text-right shrink-0">
                  <p
                    className={cn(
                      "text-sm font-black",
                      isOut
                        ? "text-red-500"
                        : isLow
                          ? "text-amber-500"
                          : "text-slate-900",
                    )}
                  >
                    {level.quantity.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400">units</p>
                </div>

                {/* Status badge */}
                <Badge
                  className={cn(
                    "text-[10px] font-bold hidden sm:flex shrink-0",
                    isOut
                      ? "bg-red-50 text-red-600 border border-red-200"
                      : isLow
                        ? "bg-amber-50 text-amber-600 border border-amber-200"
                        : "bg-emerald-50 text-emerald-600 border border-emerald-200",
                  )}
                >
                  {isOut ? "Out" : isLow ? "Low" : "OK"}
                </Badge>

                <ChevronRight
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isSelected ? "text-primary" : "text-slate-300",
                  )}
                />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
