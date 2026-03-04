"use client";

import React, { useEffect, useState, useCallback } from "react";
import apiClient from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import { format, intervalToDuration } from "date-fns";
import {
  AlertTriangle,
  CheckCircle,
  Users,
  Loader2,
  TrendingUp,
  Receipt,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type ShiftRecord = {
  id: string;
  status: "OPEN" | "CLOSED";
  openedAt: string;
  closedAt: string | null;
  startingCash: number;
  expectedCash: number;
  actualCash: number | null;
  variance: number | null;
  notes: string | null;
  user: { name: string; role: string };
  sales: { id: string }[];
};

function ShiftDurationBadge({
  openedAt,
  closedAt,
}: {
  openedAt: string;
  closedAt: string | null;
}) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    const endDate = closedAt ? new Date(closedAt) : null;
    const update = () => {
      const d = intervalToDuration({
        start: new Date(openedAt),
        end: endDate ?? new Date(),
      });
      const parts = [
        d.hours && `${d.hours}h`,
        d.minutes && `${d.minutes}m`,
      ].filter(Boolean);
      setDisplay(parts.join(" ") || "<1m");
    };
    update();
    if (!endDate) {
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    }
  }, [openedAt, closedAt]);

  return <span className="font-mono text-sm">{display}</span>;
}

export function ManagerShiftPage() {
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchShifts = useCallback(async () => {
    try {
      const res = await apiClient.get("/shifts");
      setShifts(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const openShifts = shifts.filter((s) => s.status === "OPEN");
  const closedShifts = shifts.filter((s) => s.status === "CLOSED");

  const totalRevenue = shifts.reduce((acc, s) => {
    return acc + (Number(s.expectedCash) - Number(s.startingCash));
  }, 0);
  const flaggedCount = closedShifts.filter(
    (s) => s.variance && Math.abs(Number(s.variance)) > 100,
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <p className="text-xs font-medium">Open Registers</p>
            </div>
            <p className="text-2xl font-bold">{openShifts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Receipt className="h-4 w-4" />
              <p className="text-xs font-medium">Total Shifts Today</p>
            </div>
            <p className="text-2xl font-bold">{shifts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <p className="text-xs font-medium">Total Revenue</p>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-xs font-medium">Flagged Variances</p>
            </div>
            <p
              className={`text-2xl font-bold ${flaggedCount > 0 ? "text-red-600" : ""}`}
            >
              {flaggedCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Registers */}
      {openShifts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse inline-block" />
            Active Registers ({openShifts.length})
          </h3>
          <div className="space-y-3">
            {openShifts.map((shift) => {
              const cashSales =
                Number(shift.expectedCash) - Number(shift.startingCash);
              return (
                <Card key={shift.id} className="border-green-200">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold">{shift.user.name}</p>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase">
                            {shift.user.role}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Opened {format(new Date(shift.openedAt), "h:mm a")} ·{" "}
                          <ShiftDurationBadge
                            openedAt={shift.openedAt}
                            closedAt={null}
                          />{" "}
                          elapsed
                        </p>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">
                            Float
                          </p>
                          <p className="font-bold">
                            {formatCurrency(Number(shift.startingCash))}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">
                            Cash Sales
                          </p>
                          <p className="font-bold text-green-600">
                            {formatCurrency(cashSales)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">
                            Transactions
                          </p>
                          <p className="font-bold">{shift.sales.length}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Closed Shifts History */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Closed Shifts
        </h3>
        {closedShifts.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No closed shifts yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {closedShifts.map((shift) => {
              const variance = Number(shift.variance ?? 0);
              const isFlagged = Math.abs(variance) > 100;
              return (
                <Card
                  key={shift.id}
                  className={isFlagged ? "border-red-200" : ""}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold">{shift.user.name}</p>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase">
                            {shift.user.role}
                          </span>
                          {isFlagged && (
                            <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-medium flex items-center gap-1">
                              <AlertTriangle className="h-2.5 w-2.5" /> VARIANCE
                              FLAGGED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(shift.openedAt), "h:mm a")}
                          {shift.closedAt &&
                            ` → ${format(new Date(shift.closedAt), "h:mm a")}`}
                          {" · "}
                          <ShiftDurationBadge
                            openedAt={shift.openedAt}
                            closedAt={shift.closedAt}
                          />
                        </p>
                        {shift.notes && (
                          <p className="text-xs text-muted-foreground italic mt-1">
                            Note: {shift.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">
                            Expected
                          </p>
                          <p className="font-bold">
                            {formatCurrency(Number(shift.expectedCash))}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">
                            Actual
                          </p>
                          <p className="font-bold">
                            {shift.actualCash !== null
                              ? formatCurrency(Number(shift.actualCash))
                              : "—"}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">
                            Variance
                          </p>
                          <p
                            className={`font-bold ${variance < 0 ? "text-red-600" : variance > 0 ? "text-green-600" : ""}`}
                          >
                            {variance === 0
                              ? "±0"
                              : (variance > 0 ? "+" : "") +
                                formatCurrency(variance)}
                          </p>
                        </div>
                        <CheckCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Outstanding Credit Balances */}
      <CreditBalancesSection />
    </div>
  );
}

// ─── Credit Balances ─────────────────────────────────────────────────────────

type CustomerWithCredit = {
  id: string;
  name: string;
  phone?: string;
  creditSales: {
    id: string;
    balance: number;
    totalAmount: number;
    dueDate: string | null;
  }[];
};

function CreditBalancesSection() {
  const [customers, setCustomers] = useState<CustomerWithCredit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [repayingId, setRepayingId] = useState<string | null>(null);
  const [repayAmount, setRepayAmount] = useState("");

  const fetchCredit = useCallback(async () => {
    try {
      const res = await apiClient.get<CustomerWithCredit[]>("/customers");
      setCustomers(
        res.data.filter((c) => c.creditSales?.some((cs) => cs.balance > 0)),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredit();
  }, [fetchCredit]);

  const handleRepay = async (creditSaleId: string) => {
    const amount = parseFloat(repayAmount);
    if (!amount || amount <= 0) return;
    try {
      await apiClient.post("/customers/repayments", { creditSaleId, amount });
      setRepayingId(null);
      setRepayAmount("");
      fetchCredit();
    } catch {
      /* toast handled by interceptor */
    }
  };

  if (isLoading) return null;
  if (customers.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
          Outstanding Credit
        </h3>
        <span className="ml-auto text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
          {customers.length} customer{customers.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-2">
        {customers.map((customer) => {
          const totalOwed = customer.creditSales.reduce(
            (sum, cs) => sum + Number(cs.balance),
            0,
          );
          const overdueCredit = customer.creditSales.find(
            (cs) =>
              cs.dueDate && new Date(cs.dueDate) < new Date() && cs.balance > 0,
          );

          return (
            <Card
              key={customer.id}
              className={`border ${overdueCredit ? "border-red-200 bg-red-50/30" : "border-amber-100"}`}
            >
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-sm">
                    {customer.name}
                  </p>
                  {customer.phone && (
                    <p className="text-xs text-slate-400">{customer.phone}</p>
                  )}
                  {overdueCredit && (
                    <p className="text-xs font-semibold text-red-600 mt-0.5">
                      Overdue since{" "}
                      {format(new Date(overdueCredit.dueDate!), "MMM d")}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">Balance</p>
                    <p
                      className={`font-black text-sm ${overdueCredit ? "text-red-600" : "text-amber-600"}`}
                    >
                      {formatCurrency(totalOwed)}
                    </p>
                  </div>

                  {repayingId === customer.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Amount"
                        value={repayAmount}
                        onChange={(e) => setRepayAmount(e.target.value)}
                        className="w-24 h-8 text-sm border border-slate-200 rounded-lg px-2 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        className="text-xs font-bold bg-primary text-slate-900 px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                        onClick={() => handleRepay(customer.creditSales[0]?.id)}
                      >
                        Save
                      </button>
                      <button
                        className="text-xs text-slate-400 hover:text-slate-600"
                        onClick={() => {
                          setRepayingId(null);
                          setRepayAmount("");
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      className="text-xs font-bold text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
                      onClick={() => setRepayingId(customer.id)}
                    >
                      Record Payment
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
