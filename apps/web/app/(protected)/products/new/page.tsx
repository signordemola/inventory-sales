"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, ProductInput } from "@/schemas/products";
import { useRouter } from "next/navigation";
import { useCreateProduct } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { BasicInformationSection } from "@/components/products/basic-information-section";
import { PricingSection } from "@/components/products/pricing-section";

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

  const previewUrls = pendingImages.map((file) => URL.createObjectURL(file));

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

        const newProduct = await createMutation.mutateAsync(payload);

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

  return (
    <div className="flex-1 p-6 md:p-10 h-full overflow-y-auto bg-white dark:bg-slate-950">
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
          <BasicInformationSection
            form={form}
            categories={categories}
            previewUrls={previewUrls}
            setPendingImages={setPendingImages}
            isPending={isPending}
            handleNameChange={handleNameChange}
          />

          <PricingSection form={form} />

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
