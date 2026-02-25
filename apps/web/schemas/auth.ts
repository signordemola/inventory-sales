import * as z from "zod";

export const LoginSchema = z.object({
  email: z.email({ message: "Please enter a valid email address!" }),
  password: z
    .string()
    .min(1, "Password is required!")
    .min(5, "Password must be at least 5 characters"),
});

export type LoginInput = z.infer<typeof LoginSchema>;
