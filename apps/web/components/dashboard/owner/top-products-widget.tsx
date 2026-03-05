"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { formatCurrency } from "@/lib/utils";
import { Trophy } from "lucide-react";

export const TopProductsWidget = () => {
  const { data: stats, isLoading, isError } = useDashboardStats();

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl border border-border shadow-sm overflow-hidden h-[380px]">
        <CardHeader className="border-b border-gray-50 bg-gray-50/30">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="h-full pt-6 space-y-4 flex flex-col">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex gap-4 w-full">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-2 w-full" />
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="bg-white rounded-xl border border-border shadow-sm overflow-hidden h-[380px]">
        <CardHeader className="border-b border-gray-50 bg-gray-50/30">
          <CardTitle className="text-sm font-bold text-foreground tracking-tight uppercase">
            Top 5 Products
          </CardTitle>
        </CardHeader>
        <CardContent className="h-full flex items-center justify-center">
          <p className="text-sm text-red-500">Failed to load top products</p>
        </CardContent>
      </Card>
    );
  }

  const topProducts = stats?.topProducts || [];
  const maxQty = Math.max(...topProducts.map((p) => p.quantitySold), 1);

  return (
    <Card className="bg-white rounded-xl border border-border shadow-sm overflow-hidden h-[380px] flex flex-col">
      <CardHeader className="border-b border-gray-50 bg-gray-50/30 flex flex-row items-center gap-2 py-4">
        <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
          <Trophy className="w-4 h-4" />
        </div>
        <div>
          <CardTitle className="text-sm font-bold text-foreground tracking-tight uppercase">
            Top 5 Products
          </CardTitle>
          <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
            By quantity sold
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-6 pb-4 overflow-y-auto pr-2">
        {topProducts.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm font-semibold text-slate-400">
            No product sales data available
          </div>
        ) : (
          <div className="space-y-5">
            {topProducts.map((product, index) => {
              const widthPct = (product.quantitySold / maxQty) * 100;
              return (
                <div key={product.id} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">
                        #{index + 1}
                      </div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-primary transition-colors">
                        {product.name}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {product.quantitySold}{" "}
                        <span className="text-slate-400 font-semibold">
                          sold
                        </span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600">
                        {formatCurrency(product.revenue)}
                      </span>
                    </div>
                  </div>
                  {/* Progress bar representing relative volume */}
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-orange-400 to-amber-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
