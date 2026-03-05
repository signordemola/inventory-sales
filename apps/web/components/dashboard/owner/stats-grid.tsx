"use client";

import React from "react";
import { StatCard } from "../stat-card";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

export function OwnerStatsGrid() {
  const { data: stats, isLoading } = useDashboardStats();

  // using formatCurrency from @/lib/utils

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <Skeleton
              key={`stat-skel-${i}`}
              className="h-32 w-full rounded-2xl"
            />
          ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Monthly Revenue"
        value={formatCurrency(stats?.thisMonthRevenue || 0)}
        trend={stats?.revenueGrowth ? Math.round(stats.revenueGrowth) : 0}
        description="vs last month"
        gradient
      />
      <StatCard
        title="Transactions Today"
        value={(stats?.todaySalesCount || 0).toString()}
        description="total completed sales"
      />
      <StatCard
        title="Gross Profit (Today)"
        value={formatCurrency(stats?.grossProfit || 0)}
        description="real-time margin"
      />
      <StatCard
        title="Pending Credit"
        value={formatCurrency(stats?.pendingCredit || 0)}
        trend={0}
        description="total customer debt"
      />
      <StatCard
        title="Stock Value"
        value={formatCurrency(stats?.totalStockValue || 0)}
        trend={stats?.lowStockCount ? -stats.lowStockCount : 0}
        description={`${stats?.lowStockCount || 0} items low on stock`}
      />
    </div>
  );
}
