"use client";

import React from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";

export const SalesChart = () => {
  const { data: stats, isLoading, isError } = useDashboardStats();

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <CardHeader className="border-b border-gray-50 bg-gray-50/30">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="h-80 pt-6">
          <Skeleton className="h-full w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <CardHeader className="border-b border-gray-50 bg-gray-50/30">
          <CardTitle className="text-sm font-bold text-foreground tracking-tight uppercase">
            Sales Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-sm text-red-500">
            Failed to load sales trend data
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = stats?.salesTrend || [];

  return (
    <Card className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      <CardHeader className="border-b border-gray-50 bg-gray-50/30 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-sm font-bold text-foreground tracking-tight uppercase">
            Daily Sales Trends
          </CardTitle>
          <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
            Revenue over the last 7 days
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-slate-50 p-1 border border-border">
          <button className="rounded-md bg-white px-2 py-0.5 text-[9px] font-bold text-foreground shadow-xs border border-border">
            WEEK
          </button>
          <button className="rounded-md px-2 py-0.5 text-[9px] font-bold text-muted-foreground hover:text-foreground transition-colors uppercase">
            MONTH
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#137fec" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#137fec" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }}
                tickFormatter={(value) => `₦${value / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  backgroundColor: "#fff",
                  fontSize: "11px",
                  fontWeight: "700",
                }}
                cursor={{ stroke: "#137fec", strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#137fec"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
