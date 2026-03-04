"use client";

import React from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { ProductInput } from "@/schemas/products";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

const inputCls =
  "flex w-full h-10 rounded-xl bg-slate-50 border-slate-200 font-medium";

export function PricingSection({
  form,
}: {
  form: UseFormReturn<ProductInput>;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
      <h2 className="text-base font-black text-slate-900 tracking-tight">
        Pricing & Stock
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Controller
          name="buyingPrice"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor={field.name}>Buying Price (₦)</FieldLabel>
                <Input
                  id={field.name}
                  type="number"
                  min={0}
                  step={0.01}
                  className={inputCls}
                  placeholder="0.00"
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === "" ? undefined : Number(val));
                  }}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          name="sellingPrice"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor={field.name}>Selling Price (₦)</FieldLabel>
                <Input
                  id={field.name}
                  type="number"
                  min={0}
                  step={0.01}
                  className={inputCls}
                  placeholder="0.00"
                  value={field.value ?? 0}
                  onChange={(e) =>
                    field.onChange(parseFloat(e.target.value) || 0)
                  }
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          name="lowStockThreshold"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor={field.name}>
                  Low Stock Threshold
                </FieldLabel>
                <Input
                  id={field.name}
                  type="number"
                  min={0}
                  className={inputCls}
                  placeholder="5"
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === "" ? undefined : Number(val));
                  }}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </FieldContent>
            </Field>
          )}
        />
      </div>
    </div>
  );
}
