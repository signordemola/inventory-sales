import React from "react";
import { requireAny } from "@/lib/dal";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { OwnerStatsGrid } from "@/components/dashboard/owner/stats-grid";
import { StatCard } from "@/components/dashboard/stat-card";
import { CashierShiftDashboard } from "@/components/dashboard/cashier/shift-dashboard";

export default async function DashboardPage() {
  const session = await requireAny();
  const role = session.user.role;

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 h-full overflow-y-auto bg-slate-50/30">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {role === "OWNER"
            ? "Owner Dashboard"
            : role === "MANAGER"
              ? "Manager Dashboard"
              : "Cashier Dashboard"}
        </h1>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
          {role === "OWNER"
            ? "Business performance & analytics."
            : role === "MANAGER"
              ? "Store operations & inventory overview."
              : "Your shift overview and recent activity."}
        </p>
      </div>

      {role === "OWNER" ? (
        <OwnerStatsGrid />
      ) : role === "CASHIER" ? (
        <CashierShiftDashboard />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today's Sales"
            value="128"
            trend={8}
            description="units sold today"
            gradient
          />
          <StatCard
            title="Revenue"
            value="₦185,200"
            trend={10}
            description="vs yesterday"
          />
          <StatCard
            title="Low Stock"
            value="14"
            trend={-5}
            description="items below threshold"
          />
          <StatCard
            title="Active Staff"
            value="6"
            trend={0}
            description="currently on shift"
          />
        </div>
      )}

      {role !== "CASHIER" && (
        <>
          <SalesChart />
          <RecentTransactions />
        </>
      )}
    </div>
  );
}
