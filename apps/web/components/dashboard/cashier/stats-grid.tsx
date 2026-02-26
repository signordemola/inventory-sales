"use client";

import React, { useState, useEffect } from "react";
import { StatCard } from "../stat-card";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { Skeleton } from "@/components/ui/skeleton";

export function CashierStatsGrid() {
  const { data: stats, isLoading } = useDashboardStats();
  const [shiftTime, setShiftTime] = useState("00:00:00");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(value);
  };

  useEffect(() => {
    const startTime = Date.now() - (1000 * 60 * 60 * 4 + 1000 * 60 * 22); // Simulated 4h 22m shift start
    const timer = setInterval(() => {
      const diff = Date.now() - startTime;
      const hours = Math.floor(diff / (1000 * 60 * 60))
        .toString()
        .padStart(2, "0");
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        .toString()
        .padStart(2, "0");
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        .toString()
        .padStart(2, "0");
      setShiftTime(`${hours}:${minutes}:${seconds}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title="My Sales (Today)"
        value={formatCurrency(stats?.todayRevenue || 0)}
        trend={15}
        description={`${stats?.todaySalesCount || 0} orders today`}
        gradient
      />
      <StatCard
        title="Active Credits"
        value={formatCurrency(stats?.pendingCredit || 0)}
        trend={0}
        description="pending collections"
      />
      <StatCard
        title="Shift Time"
        value={shiftTime}
        description="time since login"
      />
    </div>
  );
}
