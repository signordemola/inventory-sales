import * as z from "zod";

export const openRegisterSchema = z.object({
  startingCash: z
    .number({ error: "Starting cash is required" })
    .min(0, "Starting cash cannot be negative"),
});

export type OpenRegisterInput = z.infer<typeof openRegisterSchema>;

export const closeRegisterSchema = z.object({
  actualCash: z
    .number({ error: "Please enter the cash amount" })
    .min(0, "Cash count cannot be negative"),
  notes: z.string().max(500).optional(),
});

export type CloseRegisterInput = z.infer<typeof closeRegisterSchema>;
