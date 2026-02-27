import * as z from "zod";

export const LoginSchema = z.object({
  email: z.email({ message: "Please enter a valid email address!" }),
  password: z
    .string()
    .min(1, "Password is required!")
    .min(5, "Password must be at least 5 characters"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z
  .object({
    name: z.string().min(1, "Name is required!"),
    password: z
      .string()
      .min(1, "Password is required!")
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password!"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type RegisterInput = z.infer<typeof RegisterSchema>;
