"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  Banknote,
  Activity,
  ArrowRight,
  Clock,
  TrendingUp,
  Receipt,
  CheckCircle,
  Timer,
  WifiOff,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/axios";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { format, intervalToDuration } from "date-fns";
import { CloseRegisterModal } from "@/components/shifts/close-register-modal";
import { ZReportModal, ZReportData } from "@/components/shifts/z-report-modal";

const SHIFT_DURATION_HOURS = 6;
const SHIFT_DURATION_MS = SHIFT_DURATION_HOURS * 60 * 60 * 1000;

type ShiftMetrics = {
  grossSales: number;
  transactionCount: number;
  cashDrawerExpected: number;
  recentSales: {
    id: string;
    reference: string;
    total: number;
    status: string;
    createdAt: string;
    items: { quantity: number; product: { name: string } }[];
  }[];
  lowStockItems: {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    threshold: number;
  }[];
  shiftDetails: {
    id: string;
    startingCash: number;
    openedAt: string;
    status: string;
  } | null;
};

type PastSession = {
  id: string;
  openedAt: string;
  closedAt: string | null;
  status: string;
  startingCash: number;
  expectedCash: number;
  actualCash: number | null;
  variance: number | null;
};

function LiveShiftTimer({ openedAt }: { openedAt: string }) {
  const [elapsed, setElapsed] = useState(0); // ms elapsed

  useEffect(() => {
    const update = () => {
      setElapsed(Date.now() - new Date(openedAt).getTime());
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [openedAt]);

  const d = intervalToDuration({ start: 0, end: elapsed });
  const timeStr = [
    String(d.hours ?? 0).padStart(2, "0"),
    String(d.minutes ?? 0).padStart(2, "0"),
    String(d.seconds ?? 0).padStart(2, "0"),
  ].join(":");

  const progress = Math.min((elapsed / SHIFT_DURATION_MS) * 100, 100);
  const remaining = Math.max(SHIFT_DURATION_MS - elapsed, 0);
  const remD = intervalToDuration({ start: 0, end: remaining });
  const remStr =
    remaining === 0
      ? "Shift overtime"
      : `${remD.hours ?? 0}h ${remD.minutes ?? 0}m remaining`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Elapsed</span>
        </div>
        <span className="font-mono text-3xl font-bold text-primary">
          {timeStr}
        </span>
      </div>
      <div className="space-y-1">
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              progress >= 100
                ? "bg-red-500"
                : progress >= 80
                  ? "bg-orange-400"
                  : "bg-primary"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>{format(new Date(openedAt), "h:mm a")} start</span>
          <span className={progress >= 100 ? "text-red-600 font-semibold" : ""}>
            {remStr}
          </span>
          <span>
            {format(
              new Date(new Date(openedAt).getTime() + SHIFT_DURATION_MS),
              "h:mm a",
            )}{" "}
            end
          </span>
        </div>
      </div>
    </div>
  );
}

export const CashierShiftDashboard = () => {
  const router = useRouter();
  const [metrics, setMetrics] = useState<ShiftMetrics | null>(null);
  const [pastSessions, setPastSessions] = useState<PastSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [reportFetchingId, setReportFetchingId] = useState<string | null>(null);
  const [selectedZReport, setSelectedZReport] = useState<ZReportData | null>(
    null,
  );

  const isOnline = React.useSyncExternalStore(
    React.useCallback((callback: () => void) => {
      window.addEventListener("online", callback);
      window.addEventListener("offline", callback);
      return () => {
        window.removeEventListener("online", callback);
        window.removeEventListener("offline", callback);
      };
    }, []),
    () => navigator.onLine,
    () => true,
  );

  const fetchData = useCallback(async () => {
    try {
      const [metricsRes, historyRes] = await Promise.all([
        apiClient.get("/analytics/cashier-shift"),
        apiClient.get("/shifts/my"),
      ]);
      setMetrics(metricsRes.data);
      setPastSessions(historyRes.data || []);
    } catch (error) {
      console.error("Failed to fetch shift metrics", error);
      toast.error("Could not load your shift metrics. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFetchZReport = async (shiftId: string) => {
    try {
      setReportFetchingId(shiftId);
      const res = await apiClient.get(`/shifts/z-report/${shiftId}`);
      setSelectedZReport(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load Z-Report");
    } finally {
      setReportFetchingId(null);
    }
  };

  useEffect(() => {
    if (!isOnline) {
      setIsLoading(false);
      return;
    }
    fetchData();
  }, [fetchData, isOnline]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <WifiOff className="h-10 w-10 text-muted-foreground" />
        <p className="font-semibold text-muted-foreground">
          You&apos;re offline
        </p>
        <p className="text-sm text-muted-foreground">
          Shift metrics are not available without a connection.
        </p>
      </div>
    );
  }

  if (!metrics) return null;

  const hasShift = !!metrics.shiftDetails;
  const closedSessions = pastSessions.filter((s) => s.status === "CLOSED");

  return (
    <div className="space-y-6">
      {/* Active Shift Hero Card */}
      <Card
        className={`shadow-sm ${hasShift ? "border-primary/20 bg-primary/5" : "border-dashed border-2"}`}
      >
        <CardContent className="p-6">
          {hasShift && metrics.shiftDetails ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      SHIFT ACTIVE
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    Your Current Shift
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Started at{" "}
                    <span className="font-semibold text-foreground">
                      {format(
                        new Date(metrics.shiftDetails.openedAt),
                        "h:mm a, MMMM d",
                      )}
                    </span>{" "}
                    with a{" "}
                    <span className="font-semibold text-foreground">
                      {formatCurrency(metrics.shiftDetails.startingCash)}
                    </span>{" "}
                    float
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="lg"
                    onClick={() => router.push("/pos")}
                    className="font-bold text-background"
                  >
                    POS Terminal <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-destructive/40 text-destructive hover:bg-destructive/5"
                    onClick={() => setIsCloseModalOpen(true)}
                  >
                    Close Register
                  </Button>
                </div>
              </div>

              {/* Live Timer + Progress Bar */}
              <div className="rounded-xl bg-background border p-4">
                <LiveShiftTimer openedAt={metrics.shiftDetails.openedAt} />
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl bg-white border border-slate-200 dark:border-slate-800 p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Gross Sales
                      </p>
                      <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter mt-0.5">
                        {formatCurrency(metrics.grossSales)}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground relative z-10">
                    This shift only
                  </p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-blue-500 to-blue-500/30"></div>
                </div>
                <div className="rounded-xl bg-white border border-slate-200 dark:border-slate-800 p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Transactions
                      </p>
                      <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter mt-0.5">
                        {metrics.transactionCount}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground relative z-10">
                    Completed sales
                  </p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-orange-500 to-orange-500/30"></div>
                </div>
                <div className="rounded-xl bg-white border border-slate-200 dark:border-slate-800 p-4 hover:bg-slate-50 transition-colors relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Banknote className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Cash in Drawer
                      </p>
                      <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter mt-0.5">
                        {formatCurrency(metrics.cashDrawerExpected)}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground relative z-10">
                    Float + cash sales
                  </p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-emerald-500 to-emerald-500/30"></div>
                </div>
                <div className="rounded-xl bg-white border border-slate-200 dark:border-slate-800 p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Starting Float
                      </p>
                      <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter mt-0.5">
                        {formatCurrency(metrics.shiftDetails.startingCash)}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground relative z-10">
                    Opening cash
                  </p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-violet-500 to-violet-500/30"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="h-5 w-5" />
                  <span className="text-sm font-medium">Register Closed</span>
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  No Active Shift
                </h2>
                <p className="text-sm text-muted-foreground">
                  Open a register session to start processing sales.
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => router.push("/pos")}
                className="w-full sm:w-auto font-bold text-background"
              >
                Open Register <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card className="border-red-100">
          <CardHeader className="bg-red-50/50 pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-900">Low Stock Warnings</CardTitle>
            </div>
            <CardDescription className="text-red-700/80">
              Items running out on the floor.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {metrics.lowStockItems.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                All inventory levels look good.
              </div>
            ) : (
              <ul className="divide-y">
                {metrics.lowStockItems.map((item) => (
                  <li
                    key={item.id}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        SKU: {item.sku}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        item.quantity === 0
                          ? "bg-red-100 text-red-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {item.quantity === 0
                        ? "Out of Stock"
                        : `${item.quantity} left`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>
              {hasShift
                ? "Transactions from this shift."
                : "Your latest transactions."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {metrics.recentSales.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No sales processed yet this shift.
              </div>
            ) : (
              <ul className="divide-y">
                {metrics.recentSales.map((sale) => (
                  <li
                    key={sale.id}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {formatCurrency(sale.total)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {sale.reference}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(sale.createdAt), "h:mm a")}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${
                        sale.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {sale.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shift History */}
      {closedSessions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Recent Shift History
          </h3>
          <div className="space-y-2">
            {closedSessions.slice(0, 5).map((session) => {
              const variance = Number(session.variance ?? 0);
              const dur = session.closedAt
                ? intervalToDuration({
                    start: new Date(session.openedAt),
                    end: new Date(session.closedAt),
                  })
                : null;
              const durStr = dur
                ? [
                    dur.hours && `${dur.hours}h`,
                    dur.minutes && `${dur.minutes}m`,
                  ]
                    .filter(Boolean)
                    .join(" ") || "<1m"
                : "—";

              return (
                <Card key={session.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-sm">
                          {format(new Date(session.openedAt), "EEE, MMM d")}
                          <span className="text-muted-foreground font-normal">
                            {" · "}
                            {format(new Date(session.openedAt), "h:mm a")}
                            {session.closedAt &&
                              ` → ${format(new Date(session.closedAt), "h:mm a")}`}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Duration: {durStr}
                        </p>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">
                            Expected
                          </p>
                          <p className="font-bold">
                            {formatCurrency(Number(session.expectedCash))}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">
                            Variance
                          </p>
                          <p
                            className={`font-bold ${
                              variance < 0
                                ? "text-red-600"
                                : variance > 0
                                  ? "text-green-600"
                                  : ""
                            }`}
                          >
                            {variance === 0
                              ? "±0"
                              : (variance > 0 ? "+" : "") +
                                formatCurrency(variance)}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          Closed
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs font-semibold text-primary"
                          onClick={() => handleFetchZReport(session.id)}
                          disabled={reportFetchingId === session.id}
                        >
                          {reportFetchingId === session.id ? (
                            <Receipt className="h-3 w-3 mr-1 animate-ping" />
                          ) : (
                            <Receipt className="h-3 w-3 mr-1" />
                          )}
                          Z-Report
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {hasShift && metrics.shiftDetails && (
        <CloseRegisterModal
          isOpen={isCloseModalOpen}
          expectedCash={metrics.cashDrawerExpected}
          onClose={() => setIsCloseModalOpen(false)}
          onSuccess={() => {
            setIsCloseModalOpen(false);
            toast.success("Register closed! Shift saved.");
            fetchData();
          }}
        />
      )}

      <ZReportModal
        isOpen={selectedZReport !== null}
        zReport={selectedZReport}
        onDismiss={() => setSelectedZReport(null)}
        title="Historical Z-Report"
      />
    </div>
  );
};
