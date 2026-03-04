"use client";

import { useEffect, useState, useCallback } from "react";
import { ShoppingBag, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import apiClient from "@/lib/axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/lib/db";

interface SaleHistoryItem {
  id: string;
  reference: string;
  total: number;
  status: string;
  createdAt: string;
  cashier?: { name: string };
  payments?: { method: string }[];
  isOffline?: boolean;
}

interface SalesHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SalesHistoryModal({ isOpen, onClose }: SalesHistoryModalProps) {
  const [sales, setSales] = useState<SaleHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTodaySales = useCallback(async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];

      // Fetch online sales
      let onlineSales: SaleHistoryItem[] = [];
      try {
        const res = await apiClient.get("/sales", {
          params: { startDate: today, limit: 50 },
        });
        onlineSales = res.data.items ?? [];
      } catch {
        // silent — POS must not break if online history fails
      }

      // Fetch pending offline sales
      let offlineSales: SaleHistoryItem[] = [];
      try {
        const _pendingSales = await db.pendingSales.toArray();

        offlineSales = _pendingSales
          // Filter for sales created today and not perfectly synced
          .filter((s) => {
            const dateStr = new Date(s.createdAt).toISOString().split("T")[0];
            return dateStr === today && s.syncStatus !== "SYNCED";
          })
          .map((s) => {
            return {
              id: s.cuid, // Use local cuid as ID
              reference: s.localReference || `OFFLINE-${s.cuid.slice(0, 6)}`,
              total: s.total,
              status: "COMPLETED",
              createdAt: new Date(s.createdAt).toISOString(),
              payments: s.payments.map((p) => ({ method: p.method })),
              isOffline: true,
            };
          });
      } catch {
        console.error("Failed to read offline sales history");
      }

      // Merge and sort newest first
      const mergedSales = [...onlineSales, ...offlineSales].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      // Deduplicate by reference in case a sync just completed but offline DB wasn't cleared yet
      const uniqueSales = Array.from(
        new Map(mergedSales.map((item) => [item.reference, item])).values(),
      );

      setSales(uniqueSales);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchTodaySales();
  }, [isOpen, fetchTodaySales]);

  const getMethodLabel = (payments?: { method: string }[]) => {
    if (!payments?.length) return "—";
    const methods = [...new Set(payments.map((p) => p.method))];
    return methods.join(" + ");
  };

  const totalSalesAmount = sales.reduce((acc, s) => acc + Number(s.total), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md w-full max-h-[85vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
          <div className="flex flex-col items-center justify-center pt-2">
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl">
              {"Today's Sales"}
            </DialogTitle>
            <DialogDescription className="text-center">
              Overview of transactions from the current day
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Body */}
        <ScrollArea className="flex-1 px-2 pb-2">
          {loading ? (
            <div className="flex flex-col gap-3 p-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={`sale-skel-${i}`}
                  className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
                />
              ))}
            </div>
          ) : sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-3">
              <ShoppingBag className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">No sales yet today</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 p-3">
              {sales.map((sale) => (
                <div
                  key={sale.id}
                  className={`rounded-xl px-4 py-3 border hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                    sale.isOffline
                      ? "border-amber-200 bg-amber-50/30 dark:border-amber-900 dark:bg-amber-900/10"
                      : "border-slate-100 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {sale.reference}
                      </span>
                      {sale.isOffline && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-sm">
                          Pending Sync
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      ₦{Number(sale.total).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDistanceToNow(new Date(sale.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    <span className="uppercase font-semibold tracking-wide text-[10px]">
                      {getMethodLabel(sale.payments)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer summary */}
        {sales.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-5 py-4 flex items-center justify-between mt-auto">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Transactions
              </span>
              <span className="text-lg font-bold text-slate-700 dark:text-slate-300">
                {sales.length}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Total Revenue
              </span>
              <span className="text-lg font-black text-slate-900 dark:text-white">
                ₦{totalSalesAmount.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
