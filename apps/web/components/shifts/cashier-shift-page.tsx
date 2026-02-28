"use client";

import React, { useEffect, useState, useCallback } from "react";
import apiClient from "@/lib/axios";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { format, intervalToDuration } from "date-fns";
import {
  Clock,
  Banknote,
  CheckCircle,
  Receipt,
  Loader2,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CloseRegisterModal } from "@/components/shifts/close-register-modal";

type ActiveSession = {
  id: string;
  startingCash: number;
  openedAt: string;
  status: string;
  sales: {
    id: string;
    reference: string;
    total: number;
    status: string;
    createdAt: string;
    payments: { method: string; amount: number }[];
  }[];
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
  sales: { id: string }[];
};

function LiveTimer({ openedAt }: { openedAt: string }) {
  const [duration, setDuration] = useState("");

  useEffect(() => {
    const update = () => {
      const d = intervalToDuration({
        start: new Date(openedAt),
        end: new Date(),
      });
      const parts = [];
      if (d.hours) parts.push(`${d.hours}h`);
      if (d.minutes) parts.push(`${d.minutes}m`);
      if (d.seconds !== undefined) parts.push(`${d.seconds}s`);
      setDuration(parts.join(" ") || "0s");
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [openedAt]);

  return (
    <span className="font-mono text-3xl font-bold text-primary">
      {duration}
    </span>
  );
}

export function CashierShiftPage() {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(
    null,
  );
  const [pastSessions, setPastSessions] = useState<PastSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [currentRes, allRes] = await Promise.all([
        apiClient.get("/shifts/current"),
        apiClient.get("/shifts/my"),
      ]);
      setActiveSession(currentRes.data);
      setPastSessions(allRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Derived metrics from the active session
  const grossSales =
    activeSession?.sales
      ?.filter((s) => s.status === "COMPLETED")
      .reduce((acc, s) => acc + Number(s.total), 0) ?? 0;

  const cashSales =
    activeSession?.sales
      ?.flatMap((s) => s.payments)
      .filter((p) => p.method === "CASH")
      .reduce((acc, p) => acc + Number(p.amount), 0) ?? 0;

  const txCount =
    activeSession?.sales?.filter((s) => s.status === "COMPLETED").length ?? 0;

  const expectedCash =
    (activeSession ? Number(activeSession.startingCash) : 0) + cashSales;

  return (
    <div className="space-y-6">
      {/* Active Shift Hero */}
      {activeSession ? (
        <Card className="border-primary/30 bg-linear-to-br from-primary/5 to-transparent shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  SHIFT ACTIVE
                </span>
              </div>
              <CardTitle className="text-2xl">Your Current Shift</CardTitle>
              <CardDescription>
                Clocked in at{" "}
                <span className="font-semibold text-foreground">
                  {format(new Date(activeSession.openedAt), "h:mm a, MMMM d")}
                </span>
              </CardDescription>
            </div>
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/5"
              onClick={() => setIsCloseModalOpen(true)}
            >
              Close Register
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-6">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Shift duration:
              </span>
              <LiveTimer openedAt={activeSession.openedAt} />
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl bg-background border p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <p className="text-xs font-medium">Gross Sales</p>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(grossSales)}
                </p>
              </div>
              <div className="rounded-xl bg-background border p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Receipt className="h-4 w-4" />
                  <p className="text-xs font-medium">Transactions</p>
                </div>
                <p className="text-2xl font-bold">{txCount}</p>
              </div>
              <div className="rounded-xl bg-background border p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Banknote className="h-4 w-4" />
                  <p className="text-xs font-medium">Cash Drawer (Expected)</p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(expectedCash)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Float + Cash Sales
                </p>
              </div>
              <div className="rounded-xl bg-background border p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Banknote className="h-4 w-4" />
                  <p className="text-xs font-medium">Starting Float</p>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(Number(activeSession.startingCash))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No Active Shift</h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-4">
              You don&apos;t have an open register session. Go to the POS
              Terminal to open one.
            </p>
            <Button onClick={() => (window.location.href = "/pos")}>
              Open Register Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Shift History */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Shift History
        </h3>
        {pastSessions.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No previous shift records found.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pastSessions
              .filter((s) => s.status === "CLOSED")
              .map((session) => {
                const dur = session.closedAt
                  ? intervalToDuration({
                      start: new Date(session.openedAt),
                      end: new Date(session.closedAt),
                    })
                  : null;
                const durationStr = dur
                  ? [
                      dur.hours && `${dur.hours}h`,
                      dur.minutes && `${dur.minutes}m`,
                    ]
                      .filter(Boolean)
                      .join(" ") || "<1m"
                  : "—";
                const isShort = Number(session.variance) < 0;

                return (
                  <Card key={session.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-sm">
                            {format(
                              new Date(session.openedAt),
                              "EEE, MMM d · h:mm a",
                            )}
                            {session.closedAt && (
                              <span className="text-muted-foreground font-normal">
                                {" "}
                                → {format(new Date(session.closedAt), "h:mm a")}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Duration: {durationStr}
                          </p>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="text-muted-foreground text-xs">
                              Sales
                            </p>
                            <p className="font-bold">
                              {formatCurrency(
                                Number(session.expectedCash) -
                                  Number(session.startingCash),
                              )}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground text-xs">
                              Variance
                            </p>
                            <p
                              className={`font-bold ${session.variance === null ? "text-muted-foreground" : isShort ? "text-red-600" : "text-green-600"}`}
                            >
                              {session.variance === null
                                ? "—"
                                : (isShort ? "" : "+") +
                                  formatCurrency(
                                    Math.abs(Number(session.variance)),
                                  )}
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            Closed
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}
      </div>

      {activeSession && (
        <CloseRegisterModal
          isOpen={isCloseModalOpen}
          expectedCash={expectedCash}
          onClose={() => setIsCloseModalOpen(false)}
          onSuccess={() => {
            setIsCloseModalOpen(false);
            toast.success("Register closed successfully! Shift saved.");
            setActiveSession(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
