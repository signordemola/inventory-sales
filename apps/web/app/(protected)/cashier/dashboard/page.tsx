import React from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { ShoppingCart, UserCheck, Timer } from "lucide-react";

const CashierDashboardPage = () => {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            POS Dashboard
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Quick access to your sales activity.
          </p>
        </div>
        <button className="bg-primary text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-2">
          <ShoppingCart className="size-5" />
          New Sale (F1)
        </button>
      </div>

      {/* Cashier KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="My Sales (Today)"
          value="₦45,800"
          trend={15}
          description="vs my avg"
          gradient
        />
        <StatCard
          title="Active Credits"
          value="4"
          trend={0}
          description="pending collections"
        />
        <StatCard
          title="Shift Time"
          value="04:22:15"
          description="time since login"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTransactions />
        </div>
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <UserCheck className="size-4 text-primary" />
              Top Regulars
            </h4>
            <div className="space-y-4">
              {[
                { name: "John Doe", visits: 12 },
                { name: "Jane Smith", visits: 8 },
                { name: "Adebayo K.", visits: 5 },
              ].map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-medium text-slate-600 dark:text-slate-400">
                    {c.name}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {c.visits} orders
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-sm">
            <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
              <Timer className="size-4" />
              Quick Tip
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Remember to verify customer credit limits before finalizing large
              orders. Use the search bar for quick lookup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashierDashboardPage;

