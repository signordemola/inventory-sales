import * as z from "zod";

export const CategorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
});

export type CategoryInput = z.infer<typeof CategorySchema>;
