"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useRecentSales } from "@/hooks/use-recent-sales";
import { formatDistanceToNow } from "date-fns";
import { Sale } from "@/types/sales";

export function RecentTransactions() {
  const { data: transactions, isLoading, isError } = useRecentSales(5);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "CANCELLED":
      case "REFUNDED":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <CardHeader className="border-b border-gray-50 bg-gray-50/30">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 items-center">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <CardHeader className="border-b border-gray-50 bg-gray-50/30">
          <CardTitle className="text-sm font-bold text-foreground tracking-tight uppercase">
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="py-10 text-center">
          <p className="text-sm text-red-500">Failed to load transactions</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      <CardHeader className="border-b border-gray-50 bg-gray-50/30 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-bold text-foreground tracking-tight uppercase">
          Recent Transactions
        </CardTitle>
        <button className="text-[10px] font-bold text-primary hover:underline transition-all">
          VIEW ALL
        </button>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-6">
          {transactions?.map((tx: Sale) => (
            <div
              key={tx.id}
              className="flex gap-4 group cursor-pointer hover:bg-gray-50/50 p-2 -m-2 rounded-lg transition-colors"
            >
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0">
                {(tx.customer?.name || "C").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center mb-0.5">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {tx.customer?.name || "Walk-in Customer"}
                  </p>
                  <p className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(tx.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <div className="flex justify-between items-end">
                  <p className="text-xs text-muted-foreground truncate uppercase tracking-tighter">
                    {tx.reference}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-foreground">
                      {formatCurrency(tx.total)}
                    </span>
                    <Badge
                      className={`rounded-full px-2 py-0 text-[9px] font-bold border-0 shadow-none h-4 ${getStatusColor(
                        tx.status,
                      )}`}
                    >
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {!transactions?.length && (
            <p className="text-sm text-center text-gray-500 py-4">
              No recent transactions
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
