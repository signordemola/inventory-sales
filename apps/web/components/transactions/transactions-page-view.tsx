"use client";

import React, { useState } from "react";
import { useTransactions } from "@/hooks/use-transactions";
import { useStaff } from "@/hooks/use-staff";
import { Download, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TransactionsTable } from "@/components/transactions/transactions-table";

export function TransactionsPageView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cashierId, setCashierId] = useState("");
  const [dateRange, setDateRange] = useState("");

  const { data, isLoading, isFetching } = useTransactions({
    page,
    limit: 20,
    search: search.length >= 3 ? search : undefined,
    status,
    paymentMethod,
    cashierId,
  });

  const { data: staffData } = useStaff();

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
            placeholder="Search reference..."
            className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-primary/20"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="h-11 px-4 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
          value={dateRange}
          onChange={(e) => {
            setDateRange(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Date: All</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>

        <select
          className="h-11 px-4 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 max-w-[180px] truncate"
          value={cashierId}
          onChange={(e) => {
            setCashierId(e.target.value);
            setPage(1);
          }}
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
          value={paymentMethod}
          onChange={(e) => {
            setPaymentMethod(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Payment: All Types</option>
          <option value="CASH">Cash</option>
          <option value="CARD">POS / Card</option>
          <option value="TRANSFER">Transfer</option>
        </select>

        <select
          className="h-11 px-4 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
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
          page={page}
          totalItems={data?.meta.total || 0}
          totalPages={data?.meta.totalPages || 0}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
