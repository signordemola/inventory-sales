"use client";

import { useRole } from "@/components/providers/RoleProvider";
import { CashierShiftPage } from "@/components/shifts/cashier-shift-page";
import { ManagerShiftPage } from "@/components/shifts/manager-shift-page";

export default function ShiftsPage() {
  const { role } = useRole();

  const isManager = role === "OWNER" || role === "MANAGER";

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isManager ? "Shift Management" : "My Shift"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isManager
            ? "Monitor all active registers, review shift history, and audit cash variances."
            : "Track your current register session, shift duration, and sales history."}
        </p>
      </div>
      {isManager ? <ManagerShiftPage /> : <CashierShiftPage />}
    </div>
  );
}
