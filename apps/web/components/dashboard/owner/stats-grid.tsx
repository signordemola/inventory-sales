"use client";

import React from "react";
import { StatCard } from "../stat-card";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import {
  Banknote,
  ShoppingCart,
  TrendingUp,
  CreditCard,
  Package,
} from "lucide-react";

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
        icon={<Banknote className="w-5 h-5" />}
        iconBg="bg-emerald-50 dark:bg-emerald-500/10"
        iconColor="text-emerald-600 dark:text-emerald-400"
        gradientClass="from-emerald-500 to-emerald-500/30"
      />
      <StatCard
        title="Transactions Today"
        value={(stats?.todaySalesCount || 0).toString()}
        description="total completed sales"
        icon={<ShoppingCart className="w-5 h-5" />}
        iconBg="bg-blue-50 dark:bg-blue-500/10"
        iconColor="text-blue-600 dark:text-blue-400"
        gradientClass="from-blue-500 to-blue-500/30"
      />
      <StatCard
        title="Gross Profit (Today)"
        value={formatCurrency(stats?.grossProfit || 0)}
        description="real-time margin"
        icon={<TrendingUp className="w-5 h-5" />}
        iconBg="bg-orange-50 dark:bg-orange-500/10"
        iconColor="text-orange-600 dark:text-orange-400"
        gradientClass="from-orange-500 to-orange-500/30"
      />
      <StatCard
        title="Pending Credit"
        value={formatCurrency(stats?.pendingCredit || 0)}
        trend={0}
        description="total customer debt"
        icon={<CreditCard className="w-5 h-5" />}
        iconBg="bg-red-50 dark:bg-red-500/10"
        iconColor="text-red-600 dark:text-red-400"
        gradientClass="from-red-500 to-red-500/30"
      />
      <StatCard
        title="Stock Value"
        value={formatCurrency(stats?.totalStockValue || 0)}
        trend={stats?.lowStockCount ? -stats.lowStockCount : 0}
        description={`${stats?.lowStockCount || 0} items low on stock`}
        icon={<Package className="w-5 h-5" />}
        iconBg="bg-violet-50 dark:bg-violet-500/10"
        iconColor="text-violet-600 dark:text-violet-400"
        gradientClass="from-violet-500 to-violet-500/30"
      />
    </div>
  );
}
