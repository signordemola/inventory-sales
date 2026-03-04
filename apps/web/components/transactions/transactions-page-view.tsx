"use client";

import React, { useReducer } from "react";
import { useTransactions } from "@/hooks/use-transactions";
import { useStaff } from "@/hooks/use-staff";
import { Download, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import apiClient from "@/lib/axios";
import { toast } from "sonner";

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
  const [state, dispatch] = useReducer(filterReducer, initialFilters);

  const { data, isLoading, isFetching } = useTransactions({
    page: state.page,
    limit: 20,
    search: state.search.length >= 3 ? state.search : undefined,
    status: state.status,
    paymentMethod: state.paymentMethod,
    cashierId: state.cashierId,
  });

  const { data: staffData } = useStaff();

  const handleDownloadReceipt = async (id: string) => {
    try {
      const loadingToastId = toast.loading("Generating receipt...");
      const res = await apiClient.post(`/sales/${id}/receipt/store`);
      toast.dismiss(loadingToastId);
      if (res.data?.url) {
        window.open(res.data.url, "_blank");
      }
    } catch {
      toast.dismiss();
      toast.error("Failed to generate receipt");
    }
  };

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 h-full overflow-y-auto bg-slate-50/30">
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
            className="h-11 px-5 rounded-xl font-bold bg-white text-slate-700 border-slate-200 shadow-sm hover:bg-slate-50"
          >
            <Download className="w-4 h-4 mr-2 text-slate-400" /> Export CSV
          </Button>
          <Button className="h-11 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-sm transition-all active:scale-95">
            + New Sale
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40 p-5 flex flex-wrap items-center gap-3">
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

      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <TransactionsTable
          transactions={data?.items || []}
          isLoading={isLoading}
          isFetching={isFetching}
          page={state.page}
          totalItems={data?.meta.total || 0}
          totalPages={data?.meta.totalPages || 0}
          onPageChange={(p) => dispatch({ type: "SET_PAGE", payload: p })}
          onDownloadReceipt={handleDownloadReceipt}
        />
      </div>
    </div>
  );
}
