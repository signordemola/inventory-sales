"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PackageOpen, LayoutList, ArrowRight } from "lucide-react";

type RestockSuggestion = {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  threshold: number;
  unitsSoldLast30Days: number;
  dailyVelocity: number;
  suggestedOrder: number;
};

export function RestockSuggestionsWidget() {
  const [suggestions, setSuggestions] = useState<RestockSuggestion[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await apiClient.get("/analytics/restock-suggestions");
        setSuggestions(res.data);
      } catch (e) {
        console.error("Failed to load restock suggestions", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSuggestions();
  }, []);

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

  const handleCreatePO = (item: RestockSuggestion) => {
    // Navigate to Suppliers with query param or store in Context
    // For MVP, navigate to the Suppliers/PO route
    router.push(
      `/dashboard/suppliers?action=new-po&productId=${item.id}&quantity=${item.suggestedOrder}`,
    );
  };

  return (
    <Card className="col-span-full lg:col-span-1 border-blue-200 shadow-sm bg-blue-50/10">
      <CardHeader className="pb-3 border-b border-blue-100 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-800">
          <LayoutList className="h-4 w-4" />
          Smart Restock Suggestions
        </CardTitle>
        <div className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
          {suggestions.length} items
        </div>
      </CardHeader>
      <CardContent className="p-0 max-h-96 overflow-y-auto">
        <ul className="divide-y divide-blue-100">
          {suggestions.map((p) => (
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
