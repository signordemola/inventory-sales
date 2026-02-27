import * as z from "zod";

export const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required."),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

export type CustomerInput = z.infer<typeof customerSchema>;
