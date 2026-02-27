"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "../ui/field";
import { Input } from "../ui/input";
import { Mail } from "lucide-react";
import { PasswordInput } from "./password-input";
import SubmitButton from "./submit-btn";
import { LoginInput, LoginSchema } from "@/schemas/auth";
import { authClient } from "@/lib/auth-client";
import { UserRole } from "@/types";

const LoginForm = () => {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<LoginInput>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = (values: LoginInput) => {
    setError("");

    startTransition(async () => {
      try {
        await authClient.signIn.email(
          {
            email: values.email,
            password: values.password,
          },
          {
            onSuccess: (ctx) => {
              if (ctx.data.user.role === UserRole.CASHIER) {
                router.push("/pos");
              } else {
                router.push("/dashboard");
              }
            },
            onError: (ctx) => {
              setError(ctx.error.message || "Failed to log in.");
            },
          },
        );
      } catch (error) {
        setError(
          error instanceof TypeError
            ? "Network error: Unable to connect to the server."
            : "An unexpected error occurred.",
        );
      }
    });
  };
  return (
    <>
      {error && (
        <Alert variant="destructive" className="my-6 border-destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 p-4 md:p-6 lg:p-8"
      >
        <FieldGroup>
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <FieldLabel
                    className="text-[#111813] text-sm font-semibold"
                    htmlFor={field.name}
                  >
                    Email Address:
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      {...field}
                      id={field.name}
                      type="email"
                      placeholder="e.g. adesuwa@example.com"
                      aria-invalid={fieldState.invalid}
                      className="form-input w-full rounded-lg border border-[#dbe6df] bg-white h-10 px-4 pl-11 text-base text-[#111813] placeholder-[#61896f] focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#61896f] pointer-events-none">
                      <Mail />
                    </span>
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <FieldLabel htmlFor={field.name}>Password:</FieldLabel>
                  <PasswordInput {...field} placeholder="••••••••" />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </FieldContent>
              </Field>
            )}
          />
        </FieldGroup>

        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-border bg-background transition-colors group-hover:border-primary"
            />
            <span className="text-sm text-foreground">Remember me</span>
          </label>
          <a
            href="#"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Forgot password?
          </a>
        </div>

        <SubmitButton isPending={isPending} buttonText="Log In" />
      </form>
    </>
  );
};

export default LoginForm;
