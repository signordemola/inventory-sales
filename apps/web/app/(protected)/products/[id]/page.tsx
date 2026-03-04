"use client";

import { useState, useTransition, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, ProductInput } from "@/schemas/products";
import { useRouter, useParams } from "next/navigation";
import {
  useProduct,
  useUpdateProduct,
  useUploadProductImage,
  useDeleteProductImage,
} from "@/hooks/use-products";
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
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string>("");
  // Track URLs deleted in this session; images are derived from product.images minus deletedUrls
  const [deletedUrls, setDeletedUrls] = useState<Set<string>>(new Set());

  const { data: product, isLoading: isFetchingProduct } = useProduct(id);
  const updateMutation = useUpdateProduct(id);
  const uploadImageMutation = useUploadProductImage(id);
  const deleteImageMutation = useDeleteProductImage(id);
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

  // Derived images list — product images minus any locally deleted ones
  const images = (product?.images ?? []).filter((url) => !deletedUrls.has(url));

  // Populate form when product loads
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        sku: product.sku,
        categoryId: product.categoryId || "",
        description: product.description || "",
        barcode: product.barcode || "",
        unit: product.unit || "pcs",
        buyingPrice: Number(product.buyingPrice ?? 0),
        sellingPrice: Number(product.sellingPrice ?? 0),
        lowStockThreshold: Number(product.lowStockThreshold ?? 5),
        isActive: product.isActive ?? true,
      });
    }
  }, [product, form]);

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

  const handleUploadImage = async (file: File) => {
    try {
      // mutateAsync triggers refetchQueries, so the new URL appears via the product query
      const result = await uploadImageMutation.mutateAsync(file);
      return result;
    } catch {
      toast.error("Failed to upload image");
      throw new Error("Upload failed");
    }
  };

  const extractPublicId = (url: string) => {
    try {
      const parts = url.split("/upload/");
      if (parts.length > 1) {
        const pathWithVersion = parts[1];
        const pathParts = pathWithVersion.split("/");
        if (pathParts[0].match(/^v\d+$/)) pathParts.shift();
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
      // Optimistically hide the deleted URL from the derived images list
      setDeletedUrls((prev) => new Set([...prev, url]));
      toast.success("Image removed");
    } catch {
      toast.error("Failed to remove image");
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
        await updateMutation.mutateAsync(payload);
        toast.success(`${values.name} updated!`);
        router.back();
      } catch (err) {
        const e = err as AxiosError<{ message: string }>;
        setFormError(e?.response?.data?.message || "Failed to update product.");
      }
    });
  };

  const inputCls =
    "flex w-full h-10 rounded-xl bg-slate-50 border-slate-200 font-medium";
  const isImageBusy =
    uploadImageMutation.isPending || deleteImageMutation.isPending;

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
            onClick={form.handleSubmit(onSubmit)}
            disabled={isPending || isImageBusy}
            className="h-12 px-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all gap-2"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </Button>
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
                      <FieldLabel htmlFor="edit-categoryId">
                        Category
                      </FieldLabel>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={(val) =>
                          field.onChange(val === "none" ? "" : val)
                        }
                      >
                        <SelectTrigger
                          id="edit-categoryId"
                          className={inputCls}
                        >
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

              {/* Images */}
              <div className="sm:col-span-2">
                <FieldGroup>
                  <Field>
                    <FieldContent>
                      <FieldLabel>Product Images</FieldLabel>
                      <ImageUpload
                        value={images}
                        onChange={() => {}}
                        onRemove={handleRemoveImage}
                        onUpload={handleUploadImage}
                        maxFiles={4}
                        disabled={isImageBusy}
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
                        Selling Price (₦){" "}
                        <span className="text-red-500">*</span>
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
        </form>
      </div>
    </div>
  );
}
