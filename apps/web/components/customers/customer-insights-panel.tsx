"use client";

import React, { useEffect, useState } from "react";
import apiClient from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  X,
  ShoppingBag,
  DollarSign,
  CalendarDays,
  Star,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type CustomerInsightsData = {
  customer: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    loyaltyPoints: number;
    notes: string | null;
  };
  lifetimeValue: number;
  averageOrderValue: number;
  totalVisits: number;
  lastVisit: string | null;
  daysSinceLastVisit: number | null;
  recentPurchases: Array<{
    id: string;
    reference: string;
    total: number;
    date: string;
    itemCount: number;
    topItem: string;
  }>;
};

interface CustomerInsightsPanelProps {
  customerId: string;
  onClose: () => void;
}

export function CustomerInsightsPanel({
  customerId,
  onClose,
}: CustomerInsightsPanelProps) {
  const [data, setData] = useState<CustomerInsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get(`/customers/${customerId}/insights`);
        setData(res.data);
      } catch (e) {
        console.error("Failed to load customer insights", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInsights();
  }, [customerId]);

  if (isLoading) {
    return (
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 z-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 z-50 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between z-10">
        <div>
          <h2 className="text-lg font-black text-slate-900">
            {data.customer.name}
          </h2>
          <p className="text-xs text-slate-500">
            {data.customer.phone || data.customer.email || "No contact info"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-emerald-200 bg-emerald-50/30 shadow-none">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                  Lifetime Value
                </p>
              </div>
              <p className="text-lg font-black text-emerald-700">
                {formatCurrency(data.lifetimeValue)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50/30 shadow-none">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  Avg Order
                </p>
              </div>
              <p className="text-lg font-black text-blue-700">
                {formatCurrency(data.averageOrderValue)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-none">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <ShoppingBag className="h-3.5 w-3.5 text-slate-500" />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Visits
                </p>
              </div>
              <p className="text-lg font-black text-slate-800">
                {data.totalVisits}
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-none">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Last Visit
                </p>
              </div>
              <p className="text-sm font-black text-slate-800">
                {data.daysSinceLastVisit !== null
                  ? data.daysSinceLastVisit === 0
                    ? "Today"
                    : `${data.daysSinceLastVisit}d ago`
                  : "Never"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Loyalty Points */}
        {data.customer.loyaltyPoints > 0 && (
          <Card className="border-amber-200 bg-amber-50/30 shadow-none">
            <CardContent className="p-3 flex items-center gap-3">
              <Star className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-bold text-amber-800">
                  {data.customer.loyaltyPoints} Loyalty Points
                </p>
                <p className="text-[10px] text-amber-600">
                  Earned from purchases
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {data.customer.notes && (
          <Card className="border-slate-200 shadow-none">
            <CardContent className="p-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Notes
              </p>
              <p className="text-sm text-slate-700">{data.customer.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Purchase History */}
        <Card className="border-slate-200 shadow-none">
          <CardHeader className="pb-2 border-b border-slate-100 p-3">
            <CardTitle className="text-xs font-bold text-slate-800">
              Recent Purchases
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentPurchases.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                No purchase history yet.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.recentPurchases.map((purchase) => (
                  <li key={purchase.id} className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {purchase.reference}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(purchase.date).toLocaleDateString()} ·{" "}
                          {purchase.itemCount} items · {purchase.topItem}
                        </p>
                      </div>
                      <span className="text-sm font-black text-slate-900">
                        {formatCurrency(purchase.total)}
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
}
