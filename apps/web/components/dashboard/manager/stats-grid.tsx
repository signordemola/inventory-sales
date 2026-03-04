"use client";

import React from "react";
import { StatCard } from "../stat-card";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { Skeleton } from "@/components/ui/skeleton";

export function ManagerStatsGrid() {
  const { data: stats, isLoading } = useDashboardStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array(4)
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
    <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Today's Sales"
        value={stats?.todaySalesCount?.toString() || "0"}
        trend={8}
        description="units sold today"
        gradient
      />
      <StatCard
        title="Revenue"
        value={formatCurrency(stats?.todayRevenue || 0)}
        trend={10}
        description="vs yesterday"
      />
      <StatCard
        title="Low Stock"
        value={stats?.lowStockCount?.toString() || "0"}
        trend={-5}
        description="items below threshold"
      />
      <StatCard
        title="Active Staff"
        value={stats?.activeStaffCount?.toString() || "0"}
        trend={0}
        description="currently on shift"
      />
    </div>
  );
}
