"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, ProductInput } from "@/schemas/products";
import { useRouter } from "next/navigation";
import { useCreateProduct } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { Button } from "@/components/ui/button";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";

export default function NewProductPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string>("");
  const [pendingImages, setPendingImages] = useState<File[]>([]);

  const createMutation = useCreateProduct();
  const { data: categories = [] } = useCategories();

  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      categoryId: "",
      description: "",
      barcode: "",
      unit: "pcs",
      buyingPrice: 0,
      sellingPrice: 0,
      lowStockThreshold: 5,
      isActive: true,
    },
  });

  // Preview URLs for pending (not-yet-uploaded) images
  const previewUrls = pendingImages.map((file) => URL.createObjectURL(file));

  // Auto-generate SKU from name if SKU is still empty
  const handleNameChange = (name: string) => {
    form.setValue("name", name);
    const currentSku = form.getValues("sku");
    if (!currentSku) {
      const slug = name
        .toUpperCase()
        .trim()
        .replace(/[^A-Z0-9]+/g, "-")
        .slice(0, 16);
      form.setValue("sku", slug);
    }
  };

  const onSubmit = (values: ProductInput) => {
    setFormError("");
    startTransition(async () => {
      try {
        const payload = {
          ...values,
          categoryId: values.categoryId || undefined,
          description: values.description?.trim() || undefined,
          barcode: values.barcode?.trim() || undefined,
        };

        // 1. Create product to get ID
        const newProduct = await createMutation.mutateAsync(payload);

        // 2. Upload any pending images
        if (pendingImages.length > 0) {
          toast.loading(`Uploading ${pendingImages.length} image(s)...`, {
            id: "upload",
          });
          const { default: apiClient } = await import("@/lib/axios");
          await Promise.all(
            pendingImages.map((file) => {
              const fd = new FormData();
              fd.append("file", file);
              return apiClient.post(`/products/${newProduct.id}/images`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
              });
            }),
          );
          toast.dismiss("upload");
        }

        toast.success(`${values.name} added to catalog!`);
        router.back();
      } catch (err) {
        toast.dismiss("upload");
        const e = err as AxiosError<{ message: string }>;
        setFormError(e?.response?.data?.message || "Failed to create product.");
      }
    });
  };

  const inputCls =
    "flex w-full h-10 rounded-xl bg-slate-50 border-slate-200 font-medium";

  return (
    <div className="flex-1 p-6 md:p-10 h-full overflow-y-auto bg-slate-50/30">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 align-top sm:align-middle">
            <Button
              type="button"
              variant="outline"
              className="h-10 w-10 p-0 rounded-xl shrink-0"
              onClick={() => router.back()}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div className="text-left w-full sm:w-auto">
              <h1 className="text-4xl font-black tracking-tight text-slate-900 font-display text-left">
                Add New Product
              </h1>
              <p className="text-sm font-semibold text-slate-500 mt-1 text-left">
                Fill in the details below to add a product to your catalog.
              </p>
            </div>
          </div>
        </div>

        {formError && (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
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
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
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
                              ? categories.find((c) => c.id === field.value)
                                  ?.name
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
                        <FieldLabel htmlFor={field.name}>
                          Description
                        </FieldLabel>
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

              {/* Images — managed outside form */}
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

          {/* Pricing & Stock */}
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
                      <FieldLabel htmlFor={field.name}>
                        Buying Price (₦)
                      </FieldLabel>
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
                      <FieldLabel htmlFor={field.name}>
                        Selling Price (₦)
                      </FieldLabel>
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

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 px-6 rounded-xl font-bold w-full sm:w-auto"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-11 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-sm transition-all active:scale-95 w-full sm:w-auto flex items-center justify-center"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isPending ? "Saving..." : "Save Product"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
