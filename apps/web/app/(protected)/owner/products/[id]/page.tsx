"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import {
  ArrowLeft,
  Save,
  Trash2,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function ProductEditorPage() {
  const params = useParams();
  const router = useRouter();
  const idValue = params?.id as string;
  const isNew = idValue === "new";
  const productId = isNew ? "" : idValue;

  const { data: product, isLoading: productLoading } = useProduct(productId);
  const { data: categories = [] } = useCategories();

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct(productId);
  const deleteMutation = useDeleteProduct();

  // Form State
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [buyingPrice, setBuyingPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [barcode, setBarcode] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when data loads
  useEffect(() => {
    if (product && !isNew) {
      setName(product.name);
      setSku(product.sku);
      setCategoryId(product.categoryId || "");
      setBuyingPrice(product.buyingPrice?.toString() || "");
      setSellingPrice(product.sellingPrice?.toString() || "");
      setBarcode(product.barcode || "");
      setLowStockThreshold(product.lowStockThreshold?.toString() || "10");
      setIsActive(product.isActive ?? true);
      setImages(product.images || []);
    }
  }, [product, isNew]);

  // Auto-generate SKU from name if empty
  useEffect(() => {
    if (isNew && name && !sku) {
      const initSku =
        name.substring(0, 3).toUpperCase() +
        "-" +
        Math.floor(1000 + Math.random() * 9000);
      setSku(initSku);
    }
  }, [name, isNew, sku]);

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Product name is required");
    if (!sku.trim()) return toast.error("SKU is required");
    if (!sellingPrice) return toast.error("Selling price is required");

    setIsSaving(true);
    const payload = {
      name,
      sku,
      categoryId: categoryId || undefined,
      buyingPrice: Number(buyingPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      barcode: barcode || undefined,
      lowStockThreshold: Number(lowStockThreshold) || 0,
      isActive,
      images: images.length > 0 ? images : undefined,
    };

    try {
      if (isNew) {
        await createMutation.mutateAsync(payload);
        toast.success("Product created successfully");
        router.push("/owner/products");
      } else {
        await updateMutation.mutateAsync(payload);
        toast.success("Product updated successfully");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save product");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      confirm(
        "Are you sure you want to delete this product? This acton cannot be undone.",
      )
    ) {
      try {
        await deleteMutation.mutateAsync(productId);
        toast.success("Product deleted");
        router.push("/owner/products");
      } catch (e: any) {
        toast.error("Failed to delete product");
      }
    }
  };

  if (productLoading && !isNew) {
    return (
      <div className="p-8 flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const margin =
    Number(buyingPrice) > 0
      ? (
          ((Number(sellingPrice) - Number(buyingPrice)) /
            Number(sellingPrice)) *
          100
        ).toFixed(1)
      : 0;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 mb-4">
          <Link
            href="/owner/products"
            className="flex items-center gap-1 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Products
          </Link>
          <span>/</span>
          {categoryId ? (
            <span className="text-slate-400">
              {categories.find((c) => c.id === categoryId)?.name || "Category"}
            </span>
          ) : (
            <span className="text-slate-400">Uncategorized</span>
          )}
          <span>/</span>
          <span className="text-slate-900">{isNew ? "New Product" : name}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {isNew ? "Create Product" : name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider",
                  isActive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600",
                )}
              >
                {isActive ? "ACTIVE" : "INACTIVE"}
              </span>
              <span className="text-sm font-bold text-emerald-600">
                SKU: {sku || "Auto-generated"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isNew && (
              <Button
                variant="outline"
                className="h-11 px-4 rounded-xl font-bold border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Delete Product</span>
              </Button>
            )}
            <Button
              className="h-11 px-6 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">Save Changes</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Core Details & Media */}
        <div className="lg:col-span-1 space-y-6">
          {/* Media Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 text-center">
            <h2 className="text-sm font-bold text-slate-900 text-left mb-4">
              Product Media
            </h2>

            {images.length > 0 ? (
              <div className="relative group rounded-xl overflow-hidden border border-slate-100 aspect-square mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={images[0]}
                  alt="Product"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setImages([])}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-emerald-100 bg-emerald-50/50 rounded-xl aspect-square flex flex-col items-center justify-center p-6 transition-colors hover:bg-emerald-50 cursor-pointer mb-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 text-emerald-500">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-700">Upload Image</p>
                <p className="text-xs text-slate-400 mt-1">
                  PNG, JPG up to 5MB
                </p>
              </div>
            )}

            {/* Placeholder for actual image upload machinery */}
            <div className="flex gap-2 justify-center">
              {images.length === 0 && (
                <Button
                  variant="outline"
                  className="w-full text-xs font-bold border-slate-200"
                  onClick={() => {
                    // Mock upload for UI purposes
                    setImages([
                      "https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=500&q=80",
                    ]);
                  }}
                >
                  <Upload className="w-3.5 h-3.5 mr-2" /> Add Image
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Inventory */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/30">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Product Details
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Golden Morn 500g"
                    className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold text-slate-900"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-slate-700 mb-2 block">
                      SKU <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="e.g. GM-500-NG"
                      className="h-11 rounded-xl bg-slate-50 border-slate-200 font-mono text-sm uppercase"
                      value={sku}
                      onChange={(e) => setSku(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700 mb-2 block">
                      Category
                    </label>
                    <select
                      className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                    >
                      <option value="">Select a category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  Pricing
                </h3>
                <div className="grid grid-cols-2 gap-4 relative">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                      Buying Price (₦)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                        ₦
                      </span>
                      <Input
                        type="number"
                        className="h-11 pl-8 rounded-xl bg-slate-50 border-slate-200 font-bold text-slate-900"
                        value={buyingPrice}
                        onChange={(e) => setBuyingPrice(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                      Selling Price (₦) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                        ₦
                      </span>
                      <Input
                        type="number"
                        className="h-11 pl-8 rounded-xl bg-slate-50 border-emerald-200 focus-visible:ring-emerald-500/20 font-black text-slate-900"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {Number(sellingPrice) > 0 && Number(buyingPrice) > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg w-max">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {margin}% Margin
                  </div>
                )}
              </div>

              <hr className="border-slate-100" />

              {/* Inventory details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Inventory Identifiers
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                      Barcode (EAN/UPC)
                    </label>
                    <Input
                      placeholder="e.g. 6151100028123"
                      className="h-11 rounded-xl bg-slate-50 border-slate-200 font-mono text-sm"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                      Low Stock Threshold
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        className="h-11 pr-12 rounded-xl bg-slate-50 border-slate-200 font-bold"
                        value={lowStockThreshold}
                        onChange={(e) => setLowStockThreshold(e.target.value)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        Units
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] font-semibold text-slate-500">
                  Alerts will be sent when total stock drops below the threshold
                  number.
                </p>
              </div>

              <hr className="border-slate-100" />

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-bold text-slate-700 cursor-pointer select-none"
                >
                  Product is Active
                </label>
              </div>
            </div>
          </div>

          {/* Quick Stats Banner (Only if editing existing product) */}
          {!isNew && product && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                  Current Stock Level
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-emerald-900">
                    {product.stockLevel || 0}
                  </span>
                  <span className="text-sm font-bold text-emerald-700 pb-1">
                    units available
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-100 bg-white"
                onClick={() => router.push(`/owner/inventory`)}
              >
                Manage Inventory
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
