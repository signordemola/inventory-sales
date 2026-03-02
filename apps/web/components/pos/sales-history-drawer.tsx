"use client";

import { useEffect, useState, useCallback } from "react";
import { ShoppingBag, Clock, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import apiClient from "@/lib/axios";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SaleHistoryItem {
  id: string;
  reference: string;
  total: number;
  status: string;
  createdAt: string;
  cashier?: { name: string };
  payments?: { method: string }[];
}

interface SalesHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SalesHistoryDrawer({
  isOpen,
  onClose,
}: SalesHistoryDrawerProps) {
  const [sales, setSales] = useState<SaleHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTodaySales = useCallback(async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const res = await apiClient.get("/sales", {
        params: { startDate: today, limit: 50 },
      });
      setSales(res.data.items ?? []);
    } catch {
      // silent — POS must not break if history fails
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

  return (
    <div
      className={cn(
        "fixed right-0 top-0 h-full w-80 z-40 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl transition-transform duration-300 flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Today&apos;s Sales
          </h3>
          {sales.length > 0 && (
            <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
              {sales.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full p-1 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex flex-col gap-3 p-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : sales.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
            <ShoppingBag className="w-10 h-10 opacity-30" />
            <p className="text-sm font-medium">No sales yet today</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1 p-3">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="rounded-xl px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-slate-500">
                    {sale.reference}
                  </span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    ₦{Number(sale.total).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(sale.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  <span className="uppercase font-semibold text-[10px]">
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
        <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-3 flex items-center justify-between text-xs text-slate-500">
          <span>
            {sales.length} transaction{sales.length !== 1 ? "s" : ""}
          </span>
          <span className="font-bold text-slate-900 dark:text-white">
            ₦
            {sales
              .reduce((acc, s) => acc + Number(s.total), 0)
              .toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
