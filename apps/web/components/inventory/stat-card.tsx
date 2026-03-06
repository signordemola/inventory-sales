import React from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 shadow-none hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
          color,
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900 dark:text-white">
          {value}
        </p>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
          {label}
        </p>
        {sub && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}
