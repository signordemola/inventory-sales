import * as z from "zod";

export const preferencesSchema = z.object({
  currency: z.string().min(1, "Currency is required"),
  taxRate: z.coerce.number().min(0, "Tax rate cannot be negative"),
});

export type PreferencesValues = z.infer<typeof preferencesSchema>;

export const businessProfileSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  logo: z.string().optional().or(z.literal("")),
});

export type BusinessProfileValues = z.infer<typeof businessProfileSchema>;
