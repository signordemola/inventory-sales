"use client";

import React, { useEffect, useState } from "react";
import apiClient from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, AlertTriangle } from "lucide-react";

type ProfitInsightsData = {
  averageMargin: number;
  lowMarginProducts: Array<{
    id: string;
    name: string;
    sku: string;
    marginPercentage: number;
    profitPerUnit: number;
  }>;
  topProfitGenerators: Array<{
    id: string;
    name: string;
    sku: string;
    marginPercentage: number;
    totalRevenue: number;
    totalProfit: number;
  }>;
};

export function ProfitInsightsWidget() {
  const [data, setData] = useState<ProfitInsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await apiClient.get("/analytics/profit-insights");
        setData(res.data);
      } catch (e) {
        console.error("Failed to load profit insights", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInsights();
  }, []);

  if (isLoading) {
    return (
      <Card className="col-span-full xl:col-span-2 shadow-sm border-slate-200">
        <CardContent className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Low Margin Alerts */}
      <Card className="border-amber-200 shadow-sm bg-amber-50/10">
        <CardHeader className="pb-3 border-b border-amber-100 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            Low Margin Alerts (&lt; 10%)
          </CardTitle>
          <div className="text-xs font-semibold bg-amber-100 text-amber-800 px-2 py-1 rounded-md">
            Avg Margin: {data.averageMargin.toFixed(1)}%
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {data.lowMarginProducts.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              All products maintain healthy margins!
            </div>
          ) : (
            <ul className="divide-y divide-amber-100">
              {data.lowMarginProducts.map((p) => (
                <li
                  key={p.id}
                  className="p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-800">{p.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                      {p.sku}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-red-600">
                      {p.marginPercentage.toFixed(1)}%
                    </p>
                    <p className="text-[10px] font-semibold text-slate-500">
                      +{formatCurrency(p.profitPerUnit)} / unit
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Top Profit Generators */}
      <Card className="border-emerald-200 shadow-sm bg-emerald-50/10">
        <CardHeader className="pb-3 border-b border-emerald-100">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-800">
            <TrendingUp className="h-4 w-4" />
            Top Profit Generators
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.topProfitGenerators.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No sales data available yet.
            </div>
          ) : (
            <ul className="divide-y divide-emerald-100">
              {data.topProfitGenerators.map((p) => (
                <li
                  key={p.id}
                  className="p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-500">
                      Margin:{" "}
                      <span className="font-semibold text-emerald-600">
                        {p.marginPercentage.toFixed(1)}%
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-700">
                      {formatCurrency(p.totalProfit)}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-500">
                      of {formatCurrency(p.totalRevenue)} rev
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
