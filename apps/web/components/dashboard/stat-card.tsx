import { Card, CardContent } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  trend?: number;
  description?: string;
  gradient?: boolean;
}

export const StatCard = ({
  title,
  value,
  trend,
  description,
  gradient,
}: StatCardProps) => {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {title}
          </p>
          {trend !== undefined && (
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                isPositive
                  ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : isNegative
                    ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
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
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {value}
          </h3>
          {description && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {description}
            </p>
          )}
        </div>
      </CardContent>
      {gradient && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-primary to-primary/30"></div>
      )}
    </Card>
  );
};
