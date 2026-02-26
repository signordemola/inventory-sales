"use client";

import { useEffect, useState } from "react";
import { useBusiness, useUpdateBusiness } from "@/hooks/use-business";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Banknote, Percent, Save, Loader2, Info } from "lucide-react";

export function PreferencesForm() {
  const { data: business, isLoading: isFetching } = useBusiness();
  const updateMutation = useUpdateBusiness();

  const [currency, setCurrency] = useState("NGN");
  const [taxRate, setTaxRate] = useState("0");

  useEffect(() => {
    if (business) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setCurrency(business.currency || "NGN");
      setTaxRate(business.taxRate?.toString() || "0");
    }
  }, [business]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({
        currency,
        taxRate: parseFloat(taxRate),
      });
      toast.success("Preferences updated successfully");
    } catch {
      toast.error("Failed to update business profile");
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const isSaving = updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      <div className="space-y-8">
        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex gap-4 items-start">
          <div className="p-2 bg-white rounded-xl shadow-sm">
            <Info className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-blue-900 leading-tight">
              System Defaults
            </p>
            <p className="text-xs text-blue-700/70 font-semibold mt-1">
              These settings affect how financial data is displayed and
              calculated across the entire application.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-slate-400" />
              Base Currency
            </label>
            <Select
              value={currency}
              onValueChange={(val) => setCurrency(val as string)}
            >
              <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                <SelectItem
                  value="NGN"
                  className="rounded-lg m-1 font-semibold"
                >
                  Nigerian Naira (₦)
                </SelectItem>
                <SelectItem
                  value="USD"
                  className="rounded-lg m-1 font-semibold"
                >
                  US Dollar ($)
                </SelectItem>
                <SelectItem
                  value="GBP"
                  className="rounded-lg m-1 font-semibold"
                >
                  British Pound (£)
                </SelectItem>
                <SelectItem
                  value="EUR"
                  className="rounded-lg m-1 font-semibold"
                >
                  Euro (€)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              Used for all transactions and reporting.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Percent className="w-4 h-4 text-slate-400" />
              Default Tax Rate (%)
            </label>
            <Input
              type="number"
              step="0.01"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              placeholder="0.00"
              className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium"
            />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              Applied automatically to new sales unless overridden.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100 flex justify-end">
        <Button
          type="submit"
          disabled={isSaving}
          className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all gap-2"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Preferences
        </Button>
      </div>
    </form>
  );
}
