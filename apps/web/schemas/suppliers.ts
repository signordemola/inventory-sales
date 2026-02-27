import * as z from "zod";

export const supplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  email: z.email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;

export const poSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  expectedDelivery: z.string().optional(),
  notes: z.string().optional(),
});

export type POFormData = z.infer<typeof poSchema>;

export const paymentSchema = z.object({
  amount: z
    .number({ message: "Amount is required" })
    .min(0.01, "Amount must be greater than 0"),
  notes: z.string().optional(),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;
