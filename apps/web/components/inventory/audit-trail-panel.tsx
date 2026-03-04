import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { StockMovement, PaginatedMovements } from "@/hooks/use-inventory";
import { MovementBadge } from "./movement-badge";

export function AuditTrailPanel({
  history,
  loadingHistory,
}: {
  history: PaginatedMovements | undefined;
  loadingHistory: boolean;
}) {
  return (
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
              history?.items.map((movement: StockMovement) => {
                const isIn = movement.type === "IN";
                const isAdj = movement.type === "ADJUSTMENT";
                const date = new Date(movement.createdAt);
                const initials =
                  movement.user?.name
                    .split(" ")
                    .map((n: string) => n[0])
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
                        <span className="text-slate-300 italic text-xs">—</span>
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
  );
}
