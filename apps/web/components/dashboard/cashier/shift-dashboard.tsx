"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  ShoppingCart,
  Activity,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/axios";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

type ShiftMetrics = {
  grossSales: number;
  transactionCount: number;
  cashDrawerExpected: number;
  recentSales: {
    id: string;
    reference: string;
    total: number;
    status: string;
    createdAt: string;
    items: { quantity: number; product: { name: string } }[];
  }[];
  lowStockItems: {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    threshold: number;
  }[];
};

export const CashierShiftDashboard = () => {
  const router = useRouter();
  const [metrics, setMetrics] = useState<ShiftMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await apiClient.get("/analytics/cashier-shift");
        setMetrics(response.data);
      } catch (error) {
        console.error("Failed to fetch shift metrics", error);
        toast.error("Could not load your shift metrics. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Launch POS CTA */}
      <Card className="border-primary/20 bg-primary/5 shadow-sm">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between p-6">
          <div className="space-y-1 mb-4 sm:mb-0">
            <h2 className="text-xl font-bold text-foreground">
              Ready to start selling?
            </h2>
            <p className="text-muted-foreground">
              Your drawer is assigned and your session is active.
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => router.push("/pos")}
            className="w-full sm:w-auto font-bold px-8 shadow-md text-background"
          >
            Launch POS Screen <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Shift Metrics Grid */}
      <h3 className="text-lg font-semibold tracking-tight">
        {"Today's Shift Activity"}
      </h3>
      <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Gross Transactions
            </CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.grossSales)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Processed by you today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Cash in Drawer
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.cashDrawerExpected)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Expected cash based on sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.transactionCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total checkout sessions
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card className="border-red-100">
          <CardHeader className="bg-red-50/50 pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-900">Low Stock Warnings</CardTitle>
            </div>
            <CardDescription className="text-red-700/80">
              Items running out on the floor.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {metrics.lowStockItems.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                All inventory levels look good.
              </div>
            ) : (
              <ul className="divide-y">
                {metrics.lowStockItems.map((item) => (
                  <li
                    key={item.id}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        SKU: {item.sku}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.quantity === 0
                            ? "bg-red-100 text-red-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {item.quantity === 0
                          ? "Out of Stock"
                          : `${item.quantity} left`}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent Sales History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>Your latest transactions today.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {metrics.recentSales.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No sales processed yet today.
              </div>
            ) : (
              <ul className="divide-y relative">
                {metrics.recentSales.map((sale) => (
                  <li
                    key={sale.id}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {formatCurrency(sale.total)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {sale.reference}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(sale.createdAt), "h:mm a")}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${
                          sale.status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {sale.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
