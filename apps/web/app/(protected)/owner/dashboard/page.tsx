"use client";

import React from "react";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { OwnerStatsGrid } from "@/components/dashboard/owner/stats-grid";

const OwnerDashboardPage = () => {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Owner Dashboard
        </h1>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
          Business performance & analytics.
        </p>
      </div>

      {/* KPI Cards Grid (Role-specific) */}
      <OwnerStatsGrid />

      {/* Chart Section (Self-contained) */}
      <SalesChart />

      {/* Transactions Widget (Self-contained) */}
      <RecentTransactions />
    </div>
  );
};

export default OwnerDashboardPage;
