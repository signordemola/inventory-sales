import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  trend?: number;
  description?: string;
  gradientClass?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
}

export const StatCard = ({
  title,
  value,
  trend,
  description,
  gradientClass,
  icon,
  iconBg,
  iconColor,
}: StatCardProps) => {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <Card className="group relative overflow-hidden transition-all hover:bg-slate-50 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-none rounded-xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  iconBg || "bg-slate-100 dark:bg-slate-800"
                } ${iconColor || "text-slate-600 dark:text-slate-400"}`}
              >
                {icon}
              </div>
            )}
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {title}
            </p>
          </div>
          {trend !== undefined && (
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                isPositive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : isNegative
                    ? "bg-red-500/10 text-red-600 dark:text-red-400"
                    : "bg-slate-500/10 text-slate-500 dark:text-slate-400"
              }`}
            >
              {isPositive ? (
                <ArrowUp className="w-3 h-3" />
              ) : isNegative ? (
                <ArrowDown className="w-3 h-3" />
              ) : (
                <Minus className="w-3 h-3" />
              )}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-1">
          <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">
            {value}
          </h3>
          {description && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {description}
            </p>
          )}
        </div>
      </CardContent>
      {gradientClass && (
        <div
          className={`absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r ${gradientClass}`}
        ></div>
      )}
    </Card>
  );
};
