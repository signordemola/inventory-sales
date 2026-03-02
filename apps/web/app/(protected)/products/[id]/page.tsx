"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  useProduct,
  useUpdateProduct,
  UpdateProductPayload,
  useUploadProductImage,
  useDeleteProductImage,
} from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: product, isLoading: isFetchingProduct } = useProduct(id);
  const updateMutation = useUpdateProduct(id);
  const uploadImageMutation = useUploadProductImage(id);
  const deleteImageMutation = useDeleteProductImage(id);

  const { data: categories = [] } = useCategories();

  const [form, setForm] = useState<UpdateProductPayload>({
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
  });

  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        sku: product.sku,
        categoryId: product.categoryId || "",
        description: product.description || "",
        barcode: product.barcode || "",
        unit: product.unit || "pcs",
        buyingPrice: product.buyingPrice,
        sellingPrice: product.sellingPrice,
        lowStockThreshold: product.lowStockThreshold || 5,
        isActive: product.isActive,
      });
      setImages(product.images || []);
    }
  }, [product]);

  const set = (
    key: keyof UpdateProductPayload,
    value: string | number | boolean,
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const generateSku = (name: string) =>
    name
      .toUpperCase()
      .trim()
      .replace(/[^A-Z0-9]+/g, "-")
      .slice(0, 16);

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      sku: prev.sku ? prev.sku : generateSku(name),
    }));
  };

  const handleUploadImage = async (file: File) => {
    setIsUploading(true);
    try {
      const result = await uploadImageMutation.mutateAsync(file);
      setImages((prev) => [...prev, result.url]);
      return result;
    } catch (error) {
      toast.error("Failed to upload image");
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const extractPublicId = (url: string) => {
    try {
      const parts = url.split("/upload/");
      if (parts.length > 1) {
        const pathWithVersion = parts[1];
        const pathParts = pathWithVersion.split("/");
        if (pathParts[0].match(/^v\d+$/)) {
          pathParts.shift();
        }
        return pathParts.join("/").split(".")[0];
      }
    } catch (e) {
      console.error("Failed to parse publicId", e);
    }
    return "";
  };

  const handleRemoveImage = async (url: string) => {
    const publicId = extractPublicId(url);
    if (!publicId) return toast.error("Could not parse image ID");

    try {
      await deleteImageMutation.mutateAsync(publicId);
      setImages((prev) => prev.filter((i) => i !== url));
      toast.success("Image removed");
    } catch {
      toast.error("Failed to remove image");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) return toast.error("Product name is required.");
    if (!form.sku?.trim()) return toast.error("SKU is required.");

    const payload: UpdateProductPayload = {
      ...form,
      categoryId: form.categoryId || undefined,
      description: form.description?.trim() || undefined,
      barcode: form.barcode?.trim() || undefined,
    };

    try {
      await updateMutation.mutateAsync(payload);
      toast.success(`${form.name} updated!`);
      router.back();
    } catch (err) {
      const e = err as AxiosError<{ message: string }>;
      toast.error(e?.response?.data?.message || "Failed to update product.");
    }
  };

  const field = "h-10 rounded-xl bg-slate-50 border-slate-200 font-medium";

  if (isFetchingProduct) {
    return (
      <div className="flex-1 p-6 md:p-10 h-full overflow-y-auto bg-slate-50/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex-1 p-6 md:p-10 h-full overflow-y-auto bg-slate-50/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 font-medium">Product not found.</p>
          <Button
            onClick={() => router.back()}
            className="mt-4"
            variant="outline"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

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
                Edit Product
              </h1>
              <p className="text-sm font-semibold text-slate-500 mt-1 text-left">
                Update details for {product.name}
              </p>
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={updateMutation.isPending || isUploading}
            className="h-12 px-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all gap-2"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2 lg:col-span-2">
                <label className="text-sm font-bold text-slate-700">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <Input
                  className={field}
                  placeholder="e.g. Peak Milk 400g"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">
                  SKU <span className="text-red-500">*</span>
                </label>
                <Input
                  className={field}
                  placeholder="e.g. PEAK-MILK-400G"
                  value={form.sku}
                  onChange={(e) => set("sku", e.target.value.toUpperCase())}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">
                  Category
                </label>
                <select
                  className="w-full h-10 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
                  value={form.categoryId || ""}
                  onChange={(e) => set("categoryId", e.target.value)}
                >
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 lg:col-span-1">
                <label className="text-sm font-bold text-slate-700">Unit</label>
                <Input
                  className={field}
                  placeholder="e.g. pcs, kg, litres"
                  value={form.unit || ""}
                  onChange={(e) => set("unit", e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-bold text-slate-700">
                  Barcode
                </label>
                <Input
                  className={field}
                  placeholder="Scan or enter barcode"
                  value={form.barcode || ""}
                  onChange={(e) => set("barcode", e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2 lg:col-span-4">
                <label className="text-sm font-bold text-slate-700">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional product description…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-medium"
                  value={form.description || ""}
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2 lg:col-span-4">
                <label className="text-sm font-bold text-slate-700">
                  Product Images
                </label>
                <ImageUpload
                  value={images}
                  onChange={() => {}}
                  onRemove={handleRemoveImage}
                  onUpload={handleUploadImage}
                  maxFiles={4}
                  disabled={
                    uploadImageMutation.isPending ||
                    deleteImageMutation.isPending
                  }
                />
              </div>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Pricing &amp; Stock
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">
                  Buying Price (₦)
                </label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  className={field}
                  placeholder="0.00"
                  value={form.buyingPrice}
                  onChange={(e) =>
                    set("buyingPrice", parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">
                  Selling Price (₦) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  className={field}
                  placeholder="0.00"
                  value={form.sellingPrice}
                  onChange={(e) =>
                    set("sellingPrice", parseFloat(e.target.value) || 0)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">
                  Low Stock Threshold
                </label>
                <Input
                  type="number"
                  min={0}
                  className={field}
                  placeholder="5"
                  value={form.lowStockThreshold}
                  onChange={(e) =>
                    set("lowStockThreshold", parseInt(e.target.value, 10) || 0)
                  }
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
