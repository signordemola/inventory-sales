"use client";

import { useRole } from "@/components/providers/RoleProvider";
import { CashierShiftPage } from "@/components/shifts/cashier-shift-page";
import { ManagerShiftPage } from "@/components/shifts/manager-shift-page";

export default function ShiftsPage() {
  const { role } = useRole();

  const isManager = role === "OWNER" || role === "MANAGER";

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 h-full overflow-y-auto bg-white dark:bg-slate-950">
      <div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight font-display">
          {isManager ? "Shift Management" : "My Shift"}
        </h1>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
          {isManager
            ? "Monitor all active registers, review shift history, and audit cash variances."
            : "Track your current register session, shift duration, and sales history."}
        </p>
      </div>
      {isManager ? <ManagerShiftPage /> : <CashierShiftPage />}
    </div>
  );
}
