"use client";

import React from "react";
import { StatCard } from "../stat-card";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { ShoppingCart, Banknote, Package, Users } from "lucide-react";

export function ManagerStatsGrid() {
  const { data: stats, isLoading } = useDashboardStats();

  // using formatCurrency from @/lib/utils

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
        icon={<ShoppingCart className="w-5 h-5" />}
        iconBg="bg-blue-50 dark:bg-blue-500/10"
        iconColor="text-blue-600 dark:text-blue-400"
        gradientClass="from-blue-500 to-blue-500/30"
      />
      <StatCard
        title="Revenue"
        value={formatCurrency(stats?.todayRevenue || 0)}
        trend={10}
        description="vs yesterday"
        icon={<Banknote className="w-5 h-5" />}
        iconBg="bg-emerald-50 dark:bg-emerald-500/10"
        iconColor="text-emerald-600 dark:text-emerald-400"
        gradientClass="from-emerald-500 to-emerald-500/30"
      />
      <StatCard
        title="Low Stock"
        value={stats?.lowStockCount?.toString() || "0"}
        trend={-5}
        description="items below threshold"
        icon={<Package className="w-5 h-5" />}
        iconBg="bg-orange-50 dark:bg-orange-500/10"
        iconColor="text-orange-600 dark:text-orange-400"
        gradientClass="from-orange-500 to-orange-500/30"
      />
      <StatCard
        title="Active Staff"
        value={stats?.activeStaffCount?.toString() || "0"}
        trend={0}
        description="currently on shift"
        icon={<Users className="w-5 h-5" />}
        iconBg="bg-violet-50 dark:bg-violet-500/10"
        iconColor="text-violet-600 dark:text-violet-400"
        gradientClass="from-violet-500 to-violet-500/30"
      />
    </div>
  );
}
