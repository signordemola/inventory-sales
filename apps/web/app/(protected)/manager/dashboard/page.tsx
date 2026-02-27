import React from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";

const StaffDashboardPage = () => {
  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 h-full overflow-y-auto bg-slate-50/30">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Manager Dashboard
        </h1>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Store operations & inventory overview.
        </p>
      </div>

      {/* Operational KPI Cards */}
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

      <div className="grid grid-cols-1 gap-6">
        <SalesChart />
      </div>

      <div>
        <RecentTransactions />
      </div>
    </div>
  );
};

export default StaffDashboardPage;
