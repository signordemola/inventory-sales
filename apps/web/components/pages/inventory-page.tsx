"use client";

import React, { useState } from "react";
import {
  useInventoryLevels,
  useInventoryHistory,
  useAdjustStock,
  StockLevel,
  StockMovementType,
} from "@/hooks/use-inventory";

import {
  Package,
  ArrowUpCircle,
  ArrowDownCircle,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MOVEMENT_TYPES: {
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

const REASON_OPTIONS: Record<StockMovementType, string[]> = {
  IN: ["Purchase Order", "Return from Customer", "Transfer In", "Other"],
  OUT: ["Damaged Goods", "Expired", "Theft", "Transfer Out", "Other"],
  ADJUSTMENT: ["Correction", "Count Discrepancy", "System Error", "Other"],
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
          color,
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900">{value}</p>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          {label}
        </p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Movement Badge ────────────────────────────────────────────────────────────
function MovementBadge({ type }: { type: StockMovementType }) {
  const styles: Record<StockMovementType, string> = {
    IN: "bg-emerald-50 text-emerald-700 border-emerald-200",
    OUT: "bg-red-50 text-red-700 border-red-200",
    ADJUSTMENT: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border tracking-wider",
        styles[type],
      )}
    >
      {type}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function InventoryPageView() {
  const { data: levels, isLoading: loadingLevels } = useInventoryLevels();
  const { data: history, isLoading: loadingHistory } = useInventoryHistory();

  const adjustStock = useAdjustStock();

  // Adjustment form state
  const [selectedLevel, setSelectedLevel] = useState<StockLevel | null>(null);
  const [movementType, setMovementType] = useState<StockMovementType>("IN");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [levelSearch, setLevelSearch] = useState("");

  // Summary stats
  const totalProducts = levels?.length ?? 0;
  const lowStock =
    levels?.filter(
      (l) => l.quantity > 0 && l.quantity <= l.product.lowStockThreshold,
    ).length ?? 0;
  const outOfStock = levels?.filter((l) => l.quantity === 0).length ?? 0;
  const totalUnits = levels?.reduce((s, l) => s + l.quantity, 0) ?? 0;

  const filteredLevels = levels?.filter(
    (l) =>
      l.product.name.toLowerCase().includes(levelSearch.toLowerCase()) ||
      (l.product.sku ?? "").toLowerCase().includes(levelSearch.toLowerCase()),
  );

  const handleAdjust = async () => {
    if (!selectedLevel) return toast.error("Select a product first");
    const qty = parseInt(quantity, 10);
    if (!qty || qty < 1) return toast.error("Enter a valid quantity");

    try {
      await adjustStock.mutateAsync({
        productId: selectedLevel.productId,
        type: movementType,
        quantity: qty,
        reason: reason || undefined,
      });
      toast.success("Stock adjustment saved");
      setSelectedLevel(null);
      setQuantity("");
      setReason("");
      setNotes("");
    } catch {
      toast.error("Failed to save adjustment");
    }
  };

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
        {/* ── Stock Levels Table ── */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <h2 className="font-bold text-slate-900">Stock Levels</h2>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                placeholder="Search product or SKU..."
                className="pl-8 h-8 text-sm bg-slate-50 border-slate-200 rounded-lg"
                value={levelSearch}
                onChange={(e) => setLevelSearch(e.target.value)}
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
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                <Package className="w-10 h-10 mb-3 text-slate-200" />
                <p className="font-semibold text-sm">No products found</p>
              </div>
            ) : (
              filteredLevels?.map((level) => {
                const isLow =
                  level.quantity > 0 &&
                  level.quantity <= level.product.lowStockThreshold;
                const isOut = level.quantity === 0;
                const isSelected = selectedLevel?.id === level.id;

                return (
                  <button
                    key={level.id}
                    className={cn(
                      "w-full px-5 py-3 flex items-center gap-3 text-left transition-colors",
                      isSelected
                        ? "bg-primary/5 border-r-2 border-primary"
                        : "hover:bg-slate-50",
                    )}
                    onClick={() => setSelectedLevel(isSelected ? null : level)}
                  >
                    {/* Image / Icon */}
                    <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden relative shrink-0 flex items-center justify-center">
                      {level.product.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={level.product.images[0]}
                          alt={level.product.name}
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

        {/* ── Adjustment Panel ── */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Manual Adjustment</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedLevel
                ? `Adjusting: ${selectedLevel.product.name}`
                : "Select a product from the table"}
            </p>
          </div>

          <div className="p-5 space-y-5">
            {/* Selected product summary */}
            {selectedLevel ? (
              <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Current Stock
                  </p>
                  <p className="text-3xl font-black text-slate-900 mt-0.5">
                    {selectedLevel.quantity.toLocaleString()}
                    <span className="text-base font-semibold text-slate-400 ml-1">
                      units
                    </span>
                  </p>
                </div>
                <button
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                  onClick={() => setSelectedLevel(null)}
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
                    onClick={() => {
                      setMovementType(m.value);
                      setReason("");
                    }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-all",
                      movementType === m.value
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
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            {/* Reason */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
                Reason Code
              </label>
              <div className="grid grid-cols-2 gap-2">
                {REASON_OPTIONS[movementType].map((r) => (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-xs font-semibold border text-left transition-all",
                      reason === r
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
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button
              className="w-full h-11 rounded-xl font-bold text-sm bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
              disabled={!selectedLevel || !quantity || adjustStock.isPending}
              onClick={handleAdjust}
            >
              {adjustStock.isPending ? "Saving..." : "Save Adjustment"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Audit Trail ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Recent Audit Trail</h2>
          <span className="text-xs font-semibold text-primary">
            {history?.meta.total ?? 0} entries total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/50">
                <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-right px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Reason
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Staff
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loadingHistory ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-3">
                        <Skeleton className="h-4 w-full rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : history?.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-slate-400 text-sm"
                  >
                    No stock movements recorded yet.
                  </td>
                </tr>
              ) : (
                history?.items.map((movement) => {
                  const isIn = movement.type === "IN";
                  const isAdj = movement.type === "ADJUSTMENT";
                  const date = new Date(movement.createdAt);
                  const initials =
                    movement.user?.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() ?? "??";

                  return (
                    <tr
                      key={movement.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-3 whitespace-nowrap">
                        <p className="font-semibold text-slate-700 text-xs">
                          {date.toLocaleDateString("en-NG", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {date.toLocaleTimeString("en-NG", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-800 text-sm">
                          {movement.product.name}
                        </p>
                        {movement.product.sku && (
                          <p className="text-[11px] text-slate-400">
                            SKU: {movement.product.sku}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <MovementBadge type={movement.type} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={cn(
                            "text-sm font-black",
                            isIn
                              ? "text-emerald-600"
                              : isAdj
                                ? "text-blue-600"
                                : "text-red-500",
                          )}
                        >
                          {isIn ? "+" : "-"}
                          {movement.quantity}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-500">
                        {movement.reason ?? (
                          <span className="text-slate-300 italic text-xs">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0">
                            {initials}
                          </div>
                          <span className="text-xs font-semibold text-slate-600 truncate max-w-[80px]">
                            {movement.user?.name ?? "Unknown"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {history && history.meta.totalPages > 1 && (
          <>
            <Separator />
            <div className="px-5 py-3 flex items-center justify-between text-xs text-slate-400">
              <span>
                Page {history.meta.page} of {history.meta.totalPages}
              </span>
              <span>{history.meta.total} total movements</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
