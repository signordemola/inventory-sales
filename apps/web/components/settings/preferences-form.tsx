"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { preferencesSchema, PreferencesValues } from "@/schemas/settings";
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
import {
  Field,
  FieldLabel,
  FieldError,
  FieldContent,
} from "@/components/ui/field";

export function PreferencesForm() {
  const { data: business, isLoading: isFetching } = useBusiness();
  const updateMutation = useUpdateBusiness();

  const form = useForm<PreferencesValues>({
    // @ts-expect-error zodResolver type mismatch with z.coerce
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      currency: "NGN",
      taxRate: 0,
    },
  });

  useEffect(() => {
    if (business) {
      form.reset({
        currency: business.currency || "NGN",
        taxRate: business.taxRate || 0,
      });
    }
  }, [business, form]);

  const onSubmit = async (data: PreferencesValues) => {
    try {
      await updateMutation.mutateAsync(data);
      toast.success("Preferences updated successfully");
    } catch {
      toast.error("Failed to update preferences");
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
    <form
      // @ts-expect-error handleSubmit parameter mismatch with z.coerce
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-10 max-w-2xl"
    >
      <div className="space-y-8">
        <div className="p-5 rounded-[2rem] bg-indigo-50/50 border border-indigo-100/50 flex gap-5 items-start">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-indigo-100">
            <Info className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-black text-indigo-900 leading-tight uppercase tracking-wider">
              System Defaults
            </p>
            <p className="text-xs text-indigo-700/70 font-bold leading-relaxed">
              These settings affect how financial data is displayed and
              calculated across the entire application.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <Field>
            <FieldLabel className="text-slate-900 font-bold">
              <Banknote className="w-4 h-4 text-primary/60" />
              Base Currency
            </FieldLabel>
            <FieldContent>
              <Controller
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:border-primary/50 focus:ring-primary/10 transition-all font-semibold text-slate-700">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-1">
                      <SelectItem
                        value="NGN"
                        className="rounded-xl py-2.5 font-bold text-slate-600 focus:bg-primary/5 focus:text-primary"
                      >
                        Nigerian Naira (₦)
                      </SelectItem>
                      <SelectItem
                        value="USD"
                        className="rounded-xl py-2.5 font-bold text-slate-600 focus:bg-primary/5 focus:text-primary"
                      >
                        US Dollar ($)
                      </SelectItem>
                      <SelectItem
                        value="GBP"
                        className="rounded-xl py-2.5 font-bold text-slate-600 focus:bg-primary/5 focus:text-primary"
                      >
                        British Pound (£)
                      </SelectItem>
                      <SelectItem
                        value="EUR"
                        className="rounded-xl py-2.5 font-bold text-slate-600 focus:bg-primary/5 focus:text-primary"
                      >
                        Euro (€)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 px-1">
                Used for all transactions and reporting.
              </p>
              <FieldError
                errors={[{ message: form.formState.errors.currency?.message }]}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="taxRate" className="text-slate-900 font-bold">
              <Percent className="w-4 h-4 text-primary/60" />
              Default Tax Rate (%)
            </FieldLabel>
            <FieldContent>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                {...form.register("taxRate")}
                placeholder="0.00"
                className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:border-primary/50 focus:ring-primary/10 transition-all font-semibold text-slate-700"
              />
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 px-1">
                Applied automatically to new sales.
              </p>
              <FieldError
                errors={[{ message: form.formState.errors.taxRate?.message }]}
              />
            </FieldContent>
          </Field>
        </div>
      </div>

      <div className="pt-8 border-t border-slate-100 flex justify-end">
        <Button
          type="submit"
          disabled={isSaving || !form.formState.isDirty}
          className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all gap-2 disabled:opacity-50 disabled:shadow-none"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </form>
  );
}
