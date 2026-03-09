"use client";

import React, { useEffect, useState } from "react";
import apiClient from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  PackageX,
  TrendingUp,
  Clock,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type DeadStockItem = {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  stockValue: number;
  daysSinceLastSale: number | null;
  neverSold: boolean;
};

type ForecastItem = {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  dailyAverage: number;
  forecastedDemand: number;
  surplus: number;
  atRisk: boolean;
};

type PeakHoursData = {
  period: string;
  totalTransactions: number;
  distribution: Array<{
    hour: number;
    label: string;
    salesCount: number;
    revenue: number;
  }>;
  peakHours: string[];
  quietHours: string[];
};

export function BusinessInsightsWidget() {
  const [activeTab, setActiveTab] = useState<"dead" | "forecast" | "peak">(
    "dead",
  );
  const [deadStock, setDeadStock] = useState<DeadStockItem[] | null>(null);
  const [forecast, setForecast] = useState<ForecastItem[] | null>(null);
  const [peakHours, setPeakHours] = useState<PeakHoursData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deadRes, forecastRes, peakRes] = await Promise.all([
          apiClient.get("/analytics/dead-stock"),
          apiClient.get("/analytics/demand-forecast"),
          apiClient.get("/analytics/peak-hours"),
        ]);
        setDeadStock(deadRes.data);
        setForecast(forecastRes.data);
        setPeakHours(peakRes.data);
      } catch (e) {
        console.error("Failed to load insights", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Card className="col-span-full shadow-sm border-slate-200">
        <CardContent className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </CardContent>
      </Card>
    );
  }

  const tabs = [
    {
      id: "dead" as const,
      label: "Dead Stock",
      icon: PackageX,
      count: deadStock?.length || 0,
    },
    {
      id: "forecast" as const,
      label: "Demand Forecast",
      icon: TrendingUp,
      count: forecast?.filter((f) => f.atRisk).length || 0,
    },
    {
      id: "peak" as const,
      label: "Peak Hours",
      icon: Clock,
      count: peakHours?.peakHours?.length || 0,
    },
  ];

  return (
    <Card className="col-span-full border-violet-200 shadow-sm bg-violet-50/10">
      <CardHeader className="pb-3 border-b border-violet-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-violet-800">
            <Lightbulb className="h-4 w-4" />
            AI Business Insights
          </CardTitle>
          <div className="flex gap-1 bg-violet-100/50 p-1 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-violet-800 shadow-sm"
                    : "text-violet-500 hover:text-violet-700"
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                      activeTab === tab.id
                        ? "bg-violet-100 text-violet-700"
                        : "bg-violet-200/50 text-violet-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 max-h-80 overflow-y-auto">
        {/* Dead Stock Tab */}
        {activeTab === "dead" && (
          <>
            {!deadStock || deadStock.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No dead stock detected. All products are selling!
              </div>
            ) : (
              <ul className="divide-y divide-violet-100">
                {deadStock.slice(0, 15).map((item) => (
                  <li
                    key={item.id}
                    className="p-4 hover:bg-white/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                          {item.sku}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                          <AlertTriangle className="h-3 w-3" />
                          {item.neverSold
                            ? "Never sold"
                            : `${item.daysSinceLastSale}d ago`}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span className="text-slate-500">
                        Stock:{" "}
                        <span className="font-bold text-slate-700">
                          {item.currentStock}
                        </span>
                      </span>
                      <span className="text-slate-500">
                        Value:{" "}
                        <span className="font-bold text-amber-700">
                          {formatCurrency(item.stockValue)}
                        </span>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {/* Demand Forecast Tab */}
        {activeTab === "forecast" && (
          <>
            {!forecast || forecast.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Not enough sales data for forecasting yet.
              </div>
            ) : (
              <ul className="divide-y divide-violet-100">
                {forecast.slice(0, 15).map((item) => (
                  <li
                    key={item.id}
                    className="p-4 hover:bg-white/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                          {item.sku} · {item.dailyAverage}/day avg
                        </p>
                      </div>
                      <div className="text-right">
                        {item.atRisk ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                            <AlertTriangle className="h-3 w-3" />
                            At Risk
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                            Sufficient
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span className="text-slate-500">
                        Stock:{" "}
                        <span className="font-bold text-slate-700">
                          {item.currentStock}
                        </span>
                      </span>
                      <span className="text-slate-500">
                        Need (7d):{" "}
                        <span className="font-bold text-blue-700">
                          {item.forecastedDemand}
                        </span>
                      </span>
                      <span className="text-slate-500">
                        {item.surplus >= 0 ? "Surplus" : "Deficit"}:{" "}
                        <span
                          className={`font-bold ${item.surplus >= 0 ? "text-emerald-700" : "text-red-700"}`}
                        >
                          {Math.abs(item.surplus)}
                        </span>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {/* Peak Hours Tab */}
        {activeTab === "peak" && (
          <>
            {!peakHours || peakHours.distribution.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Not enough data to determine peak hours yet.
              </div>
            ) : (
              <div className="p-4 space-y-4">
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-sm bg-violet-500"></span>
                    <span className="font-bold text-slate-600">
                      Peak: {peakHours.peakHours.join(", ")}
                    </span>
                  </div>
                  {peakHours.quietHours.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-3 h-3 rounded-sm bg-slate-200"></span>
                      <span className="font-bold text-slate-400">
                        Quiet: {peakHours.quietHours.join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Simple bar chart */}
                <div className="flex items-end gap-1 h-32">
                  {peakHours.distribution.map((h) => {
                    const maxCount = Math.max(
                      ...peakHours.distribution.map((d) => d.salesCount),
                    );
                    const height =
                      maxCount > 0 ? (h.salesCount / maxCount) * 100 : 0;
                    const isPeak = peakHours.peakHours.includes(h.label);

                    return (
                      <div
                        key={h.hour}
                        className="flex-1 flex flex-col items-center gap-1"
                      >
                        <div
                          className={`w-full rounded-t transition-all ${
                            isPeak ? "bg-violet-500" : "bg-slate-200"
                          }`}
                          style={{ height: `${Math.max(height, 4)}%` }}
                          title={`${h.label}: ${h.salesCount} sales, ${formatCurrency(h.revenue)}`}
                        />
                        <span className="text-[8px] font-bold text-slate-400">
                          {h.hour}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-center text-slate-500">
                  {peakHours.period} · {peakHours.totalTransactions} total
                  transactions
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
