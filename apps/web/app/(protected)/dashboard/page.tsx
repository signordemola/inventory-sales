import React from "react";
import { requireAny } from "@/lib/dal";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { OwnerStatsGrid } from "@/components/dashboard/owner/stats-grid";
import { TopProductsWidget } from "@/components/dashboard/owner/top-products-widget";
import { PaymentMethodsChart } from "@/components/dashboard/owner/payment-methods-chart";
import { ProfitInsightsWidget } from "@/components/dashboard/owner/profit-insights-widget";
import { RestockSuggestionsWidget } from "@/components/dashboard/owner/restock-suggestions-widget";
import { ManagerStatsGrid } from "@/components/dashboard/manager/stats-grid";
import { CashierShiftDashboard } from "@/components/dashboard/cashier/shift-dashboard";
import { ManagerShiftPage } from "@/components/shifts/manager-shift-page";

export default async function DashboardPage() {
  const session = await requireAny();
  const role = session.user.role;

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 h-full overflow-y-auto bg-slate-50/30">
      {role === "OWNER" && (
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Owner Dashboard
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Business performance &amp; analytics.
          </p>
        </div>
      )}

      {role === "OWNER" ? (
        <OwnerStatsGrid />
      ) : role === "CASHIER" ? (
        <CashierShiftDashboard />
      ) : (
        <>
          <ManagerStatsGrid />
          <ManagerShiftPage />
        </>
      )}

      {role !== "CASHIER" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SalesChart />
          </div>
          <div className="space-y-6">
            <TopProductsWidget />
            <PaymentMethodsChart />
          </div>
        </div>
      )}

      {role === "OWNER" && <ProfitInsightsWidget />}

      {role !== "CASHIER" && <RecentTransactions />}
    </div>
  );
}
