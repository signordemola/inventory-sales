"use client";

import React, { useReducer, useState, useCallback } from "react";
import { useTransactions, Transaction } from "@/hooks/use-transactions";
import { useStaff } from "@/hooks/use-staff";
import { useSessionContext } from "@/lib/session-context";
import { Download, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import apiClient from "@/lib/axios";
import { toast } from "sonner";
import { ConfirmVoidModal } from "./confirm-void-modal";
import { ReturnSaleModal } from "./return-sale-modal";
import { ReceiptModal } from "./receipt-modal";

// --- State Management ---
type FiltersState = {
  page: number;
  search: string;
  status: string;
  paymentMethod: string;
  cashierId: string;
  dateRange: string;
};

type FilterAction =
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_STATUS"; payload: string }
  | { type: "SET_PAYMENT_METHOD"; payload: string }
  | { type: "SET_CASHIER_ID"; payload: string }
  | { type: "SET_DATE_RANGE"; payload: string }
  | { type: "SET_PAGE"; payload: number };

const initialFilters: FiltersState = {
  page: 1,
  search: "",
  status: "",
  paymentMethod: "",
  cashierId: "",
  dateRange: "",
};

function filterReducer(
  state: FiltersState,
  action: FilterAction,
): FiltersState {
  switch (action.type) {
    case "SET_SEARCH":
      return { ...state, search: action.payload, page: 1 };
    case "SET_STATUS":
      return { ...state, status: action.payload, page: 1 };
    case "SET_PAYMENT_METHOD":
      return { ...state, paymentMethod: action.payload, page: 1 };
    case "SET_CASHIER_ID":
      return { ...state, cashierId: action.payload, page: 1 };
    case "SET_DATE_RANGE":
      return { ...state, dateRange: action.payload, page: 1 };
    case "SET_PAGE":
      return { ...state, page: action.payload };
    default:
      return state;
  }
}

export function TransactionsPageView() {
  const { user } = useSessionContext();
  const isCashier = user?.role === "CASHIER";

  const [state, dispatch] = useReducer(filterReducer, {
    ...initialFilters,
    cashierId: isCashier ? user.id : "",
  });

  const [voidTxn, setVoidTxn] = useState<Transaction | null>(null);
  const [returnTxn, setReturnTxn] = useState<Transaction | null>(null);
  const [viewingTxn, setViewingTxn] = useState<Transaction | null>(null);

  const { data, isLoading, isFetching } = useTransactions({
    page: state.page,
    limit: 20,
    search: state.search.length >= 3 ? state.search : undefined,
    status: state.status,
    paymentMethod: state.paymentMethod,
    cashierId: state.cashierId,
  });

  const { data: staffData } = useStaff();

  // ─── Export CSV ────────────────────────────────────────────────────────────
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = useCallback(async () => {
    setIsExporting(true);
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries({
          search: state.search.length >= 3 ? state.search : undefined,
          status: state.status,
          paymentMethod: state.paymentMethod,
          cashierId: state.cashierId,
        }).filter(([, v]) => v != null && v !== ""),
      );

      const { data: res } = await apiClient.get<{
        items: Transaction[];
        meta: { total: number };
      }>("/sales", { params: { page: 1, limit: 10000, ...cleanFilters } });

      const rows = res.items;
      if (!rows.length) {
        toast.info("No transactions to export.");
        return;
      }

      const headers = [
        "Reference",
        "Date",
        "Status",
        "Payment Method",
        "Subtotal (₦)",
        "Discount (₦)",
        "Total (₦)",
        "Cashier",
        "Customer",
      ];

      const escape = (v: string | number | null | undefined) => {
        const s = String(v ?? "");
        return s.includes(",") || s.includes('"') || s.includes("\n")
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      };

      const csvLines = [
        headers.join(","),
        ...rows.map((t) =>
          [
            escape(t.reference),
            escape(new Date(t.createdAt).toLocaleString("en-NG")),
            escape(t.status),
            escape(t.payments.map((p) => p.method).join(" + ")),
            escape(Number(t.subtotal).toFixed(2)),
            escape(Number(t.discount).toFixed(2)),
            escape(Number(t.total).toFixed(2)),
            escape(t.cashier?.name ?? "—"),
            escape(t.customer?.name ?? "Walk-in"),
          ].join(","),
        ),
      ];

      const blob = new Blob([csvLines.join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const today = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `transactions-${today}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(
        `Exported ${rows.length} transaction${rows.length !== 1 ? "s" : ""}.`,
      );
    } catch {
      toast.error("Failed to export transactions.");
    } finally {
      setIsExporting(false);
    }
  }, [state.search, state.status, state.paymentMethod, state.cashierId]);

  const handleViewReceipt = (txn: Transaction) => {
    setViewingTxn(txn);
  };

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 h-full overflow-y-auto bg-white dark:bg-slate-950">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-display">
            Transactions History
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            View and manage sales records and audit trails for compliance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-11 px-5 rounded-xl font-bold bg-white text-slate-700 border-slate-200 shadow-sm hover:bg-slate-50 disabled:opacity-60"
            onClick={handleExportCSV}
            disabled={isExporting}
          >
            <Download
              className={`w-4 h-4 mr-2 text-slate-400 ${isExporting ? "animate-bounce" : ""}`}
            />
            {isExporting ? "Exporting…" : "Export CSV"}
          </Button>
          <Button className="h-11 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-sm transition-all active:scale-95">
            + New Sale
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 dark:border-slate-800 shadow-none p-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-400 mr-2">
          <Filter className="w-4 h-4" /> Filters:
        </div>

        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            id="transaction-search"
            placeholder="Search reference..."
            className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-primary/20"
            value={state.search}
            onChange={(e) =>
              dispatch({ type: "SET_SEARCH", payload: e.target.value })
            }
          />
        </div>

        <select
          className="h-11 px-4 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
          value={state.dateRange}
          onChange={(e) =>
            dispatch({ type: "SET_DATE_RANGE", payload: e.target.value })
          }
        >
          <option value="">Date: All</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>

        {!isCashier && (
          <select
            className="h-11 px-4 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 max-w-[180px] truncate"
            value={state.cashierId}
            onChange={(e) =>
              dispatch({ type: "SET_CASHIER_ID", payload: e.target.value })
            }
          >
            <option value="">Staff: All</option>
            {staffData?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        <select
          className="h-11 px-4 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
          value={state.paymentMethod}
          onChange={(e) =>
            dispatch({ type: "SET_PAYMENT_METHOD", payload: e.target.value })
          }
        >
          <option value="">Payment: All Types</option>
          <option value="CASH">Cash</option>
          <option value="CARD">POS / Card</option>
          <option value="TRANSFER">Transfer</option>
        </select>

        <select
          className="h-11 px-4 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
          value={state.status}
          onChange={(e) =>
            dispatch({ type: "SET_STATUS", payload: e.target.value })
          }
        >
          <option value="">Status: All</option>
          <option value="COMPLETED">Completed</option>
          <option value="VOID">Void</option>
          <option value="RETURNED">Returned</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 dark:border-slate-800 shadow-none overflow-hidden">
        <TransactionsTable
          transactions={data?.items || []}
          isLoading={isLoading}
          isFetching={isFetching}
          page={state.page}
          totalItems={data?.meta.total || 0}
          totalPages={data?.meta.totalPages || 0}
          onPageChange={(p) => dispatch({ type: "SET_PAGE", payload: p })}
          onViewReceipt={handleViewReceipt}
          isCashier={isCashier}
          onVoidClick={setVoidTxn}
          onReturnClick={setReturnTxn}
        />
      </div>

      <ConfirmVoidModal
        transaction={voidTxn}
        onClose={() => setVoidTxn(null)}
      />
      <ReturnSaleModal
        transaction={returnTxn}
        onClose={() => setReturnTxn(null)}
      />

      <ReceiptModal
        isOpen={!!viewingTxn}
        onClose={() => setViewingTxn(null)}
        transaction={viewingTxn}
      />
    </div>
  );
}
