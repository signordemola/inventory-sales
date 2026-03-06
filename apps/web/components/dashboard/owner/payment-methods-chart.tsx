"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { PieChartIcon } from "lucide-react";

const PaymentMethodsClient = dynamic(() => import("./payment-methods-client"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-full" />,
});

const COLORS = ["#059669", "#f97316", "#0ea5e9", "#eab308", "#8b5cf6"];

export const PaymentMethodsChart = () => {
  const { data: stats, isLoading, isError } = useDashboardStats();

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl border border-slate-200 dark:border-slate-800 shadow-none overflow-hidden flex flex-col h-[380px]">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 bg-transparent py-4">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="h-full pt-6 flex items-center justify-center">
          <Skeleton className="h-40 w-40 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="bg-white rounded-xl border border-slate-200 dark:border-slate-800 shadow-none overflow-hidden flex flex-col h-[380px]">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 bg-transparent py-4">
          <CardTitle className="text-sm font-bold text-foreground tracking-tight uppercase">
            Revenue by Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent className="h-full flex items-center justify-center">
          <p className="text-sm text-red-500">
            Failed to load payment methods data
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = stats?.revenueByMethod || [];

  return (
    <Card className="bg-white rounded-xl border border-slate-200 dark:border-slate-800 shadow-none overflow-hidden flex flex-col h-[380px]">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 bg-transparent flex flex-row items-center gap-2 py-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <PieChartIcon className="w-4 h-4" />
        </div>
        <div>
          <CardTitle className="text-sm font-bold text-foreground tracking-tight uppercase">
            Revenue by Payment Method
          </CardTitle>
          <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
            Distribution of payment types
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-6 pb-4">
        {chartData.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm font-semibold text-slate-400">
            No payment data available
          </div>
        ) : (
          <>
            <div className="h-48 w-full shrink-0">
              <PaymentMethodsClient data={chartData} />
            </div>

            <div className="flex-1 overflow-y-auto mt-4 pr-2 space-y-2">
              {chartData.map((item, i) => (
                <div
                  key={item.name}
                  className="flex flex-row items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-black text-slate-900 dark:text-white">
                    ₦{item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
