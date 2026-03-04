"use client";

import React from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { ProductInput } from "@/schemas/products";
import { Category } from "@/hooks/use-categories";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const inputCls =
  "flex w-full h-10 rounded-xl bg-slate-50 border-slate-200 font-medium";

export function BasicInformationSection({
  form,
  categories,
  previewUrls,
  setPendingImages,
  isPending,
  handleNameChange,
}: {
  form: UseFormReturn<ProductInput>;
  categories: Category[];
  previewUrls: string[];
  setPendingImages: React.Dispatch<React.SetStateAction<File[]>>;
  isPending: boolean;
  handleNameChange: (name: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
      <h2 className="text-base font-black text-slate-900 tracking-tight">
        Basic Information
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Name */}
        <div>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <FieldLabel htmlFor={field.name}>
                    Product Name <span className="text-red-500">*</span>
                  </FieldLabel>
                  <Input
                    id={field.name}
                    className={inputCls}
                    placeholder="e.g. Peak Milk 400g"
                    value={field.value}
                    onChange={(e) => handleNameChange(e.target.value)}
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

        {/* SKU */}
        <Controller
          name="sku"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor={field.name}>
                  SKU <span className="text-red-500">*</span>
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  className={inputCls}
                  placeholder="e.g. PEAK-MILK-400G"
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </FieldContent>
            </Field>
          )}
        />

        {/* Category */}
        <Controller
          name="categoryId"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldContent>
                <FieldLabel htmlFor="categoryId">Category</FieldLabel>
                <Select
                  value={field.value ?? ""}
                  onValueChange={(val) =>
                    field.onChange(val === "none" ? "" : val)
                  }
                >
                  <SelectTrigger id="categoryId" className={inputCls}>
                    <SelectValue placeholder="None">
                      {field.value && field.value !== "none"
                        ? categories.find((c) => c.id === field.value)?.name
                        : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          )}
        />

        {/* Unit */}
        <div>
          <Controller
            name="unit"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldContent>
                  <FieldLabel htmlFor={field.name}>Unit</FieldLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id={field.name} className={inputCls}>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "pcs",
                        "pack",
                        "box",
                        "carton",
                        "bottle",
                        "can",
                        "bag",
                        "kg",
                        "litres",
                        "piece",
                        "tube",
                        "sachet",
                        "ream",
                        "basket",
                        "tin",
                        "loaf",
                      ].map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
            )}
          />
        </div>

        {/* Barcode */}
        <div>
          <Controller
            name="barcode"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldContent>
                  <FieldLabel htmlFor={field.name}>Barcode</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    className={inputCls}
                    placeholder="Scan or enter barcode"
                    value={field.value ?? ""}
                  />
                </FieldContent>
              </Field>
            )}
          />
        </div>

        {/* Description */}
        <div>
          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    rows={2}
                    placeholder="Optional product description…"
                    className="rounded-xl border border-slate-200 bg-slate-50 font-medium resize-none"
                    value={field.value ?? ""}
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

        {/* Images */}
        <div className="sm:col-span-2">
          <FieldGroup>
            <Field>
              <FieldContent>
                <FieldLabel>Product Images</FieldLabel>
                <ImageUpload
                  value={previewUrls}
                  onChange={() => {}}
                  onRemove={(url) => {
                    const index = previewUrls.indexOf(url);
                    if (index > -1) {
                      setPendingImages((prev) =>
                        prev.filter((_, i) => i !== index),
                      );
                      URL.revokeObjectURL(url);
                    }
                  }}
                  onUpload={async (file) => {
                    setPendingImages((prev) => [...prev, file]);
                    return { url: "" };
                  }}
                  maxFiles={4}
                  disabled={isPending}
                />
              </FieldContent>
            </Field>
          </FieldGroup>
        </div>
      </div>
    </div>
  );
}
