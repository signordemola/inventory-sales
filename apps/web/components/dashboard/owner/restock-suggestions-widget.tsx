"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  PackageOpen,
  LayoutList,
  ArrowRight,
  Zap,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";

type RestockSuggestion = {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  threshold: number;
  unitsSoldLast30Days: number;
  dailyVelocity: number;
  suggestedOrder: number;
  daysUntilStockout?: number;
  urgency?: "critical" | "warning" | "healthy";
};

type StockoutPrediction = {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  threshold: number;
  unitsSold30d: number;
  dailyVelocity: number;
  daysUntilStockout: number;
  urgency: "critical" | "warning" | "healthy";
  preferredSupplier: { id: string; name: string } | null;
};

export function RestockSuggestionsWidget() {
  const [suggestions, setSuggestions] = useState<RestockSuggestion[] | null>(
    null,
  );
  const [predictions, setPredictions] = useState<StockoutPrediction[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoDrafting, setIsAutoDrafting] = useState(false);
  const [autoDraftResult, setAutoDraftResult] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suggestionsRes, predictionsRes] = await Promise.all([
          apiClient.get("/analytics/restock-suggestions"),
          apiClient.get("/analytics/stockout-predictions"),
        ]);
        setSuggestions(suggestionsRes.data);
        setPredictions(predictionsRes.data);
      } catch (e) {
        console.error("Failed to load restock data", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreatePO = (item: RestockSuggestion) => {
    router.push(
      `/suppliers?action=new-po&productId=${item.id}&quantity=${item.suggestedOrder}`,
    );
  };

  const handleAutoDraftPO = async () => {
    setIsAutoDrafting(true);
    setAutoDraftResult(null);
    try {
      const res = await apiClient.post("/purchase-orders/auto-draft");
      setAutoDraftResult(res.data.message);
    } catch (e) {
      console.error("Auto-draft PO failed", e);
      setAutoDraftResult("Failed to auto-generate purchase orders.");
    } finally {
      setIsAutoDrafting(false);
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return <AlertTriangle className="h-3.5 w-3.5 text-red-600" />;
      case "warning":
        return <Clock className="h-3.5 w-3.5 text-amber-600" />;
      default:
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
    }
  };

  const getUrgencyBadge = (daysUntilStockout: number, urgency: string) => {
    const colors = {
      critical: "bg-red-100 text-red-700 border-red-200",
      warning: "bg-amber-100 text-amber-700 border-amber-200",
      healthy: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };
    const colorClass = colors[urgency as keyof typeof colors] || colors.healthy;

    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorClass}`}
      >
        {getUrgencyIcon(urgency)}
        {daysUntilStockout === 0 ? "OUT" : `${daysUntilStockout}d left`}
      </span>
    );
  };

  if (isLoading) {
    return (
      <Card className="col-span-full shadow-sm border-slate-200">
        <CardContent className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </CardContent>
      </Card>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <Card className="col-span-full shadow-sm border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center gap-2">
          <PackageOpen className="h-5 w-5 text-slate-400" />
          <CardTitle className="text-base font-bold text-slate-800">
            Smart Restock Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center text-sm text-slate-500">
          Stock levels are healthy! No restock suggestions at this time.
        </CardContent>
      </Card>
    );
  }

  // Merge prediction data into suggestions
  const predictionsMap = new Map((predictions || []).map((p) => [p.id, p]));

  const enrichedSuggestions = suggestions.map((s) => {
    const pred = predictionsMap.get(s.id);
    return {
      ...s,
      daysUntilStockout: pred?.daysUntilStockout ?? undefined,
      urgency: pred?.urgency ?? undefined,
    };
  });

  return (
    <Card className="col-span-full lg:col-span-1 border-blue-200 shadow-sm bg-blue-50/10">
      <CardHeader className="pb-3 border-b border-blue-100 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-800">
          <LayoutList className="h-4 w-4" />
          Smart Restock Suggestions
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
            {suggestions.length} items
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAutoDraftPO}
            disabled={isAutoDrafting}
            className="h-7 text-xs border-blue-300 hover:bg-blue-50 hover:text-blue-700 text-blue-600 px-3 font-semibold"
          >
            {isAutoDrafting ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Zap className="h-3 w-3 mr-1" />
            )}
            Auto-Generate POs
          </Button>
        </div>
      </CardHeader>

      {autoDraftResult && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 text-xs font-semibold text-blue-700">
          {autoDraftResult}
        </div>
      )}

      <CardContent className="p-0 max-h-96 overflow-y-auto">
        <ul className="divide-y divide-blue-100">
          {enrichedSuggestions.map((p) => (
            <li
              key={p.id}
              className="p-4 flex flex-col gap-3 hover:bg-white/50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-slate-800 leading-tight">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                    {p.sku}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-black text-blue-700">
                    Order {p.suggestedOrder}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-500">
                    velocity: {p.dailyVelocity.toFixed(1)}/day
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-1">
                <div className="flex gap-2 items-center text-xs">
                  <span
                    className={`font-semibold px-2 py-0.5 rounded ${p.currentStock === 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                  >
                    {p.currentStock} in stock
                  </span>
                  <span className="text-slate-400">/ {p.threshold} min</span>
                  {p.daysUntilStockout !== undefined &&
                    p.urgency &&
                    getUrgencyBadge(p.daysUntilStockout, p.urgency)}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCreatePO(p)}
                  className="h-7 text-xs border-blue-200 hover:bg-blue-50 hover:text-blue-700 text-slate-600 px-3"
                >
                  Create PO <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
