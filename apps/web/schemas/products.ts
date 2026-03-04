import * as z from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  sku: z.string().min(1, "SKU is required"),
  categoryId: z.string().optional(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  barcode: z.string().optional(),
  unit: z.string().optional(),
  buyingPrice: z.number().min(0, "Buying price cannot be negative").optional(),
  sellingPrice: z
    .number()
    .min(0, "Selling price cannot be negative")
    .optional(),
  lowStockThreshold: z
    .number()
    .int("Must be a whole number")
    .min(0, "Cannot be negative")
    .optional(),
  isActive: z.boolean().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
