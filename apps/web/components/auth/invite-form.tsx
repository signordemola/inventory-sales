"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import SubmitButton from "@/components/auth/submit-btn";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/password-input";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { useAcceptInvite, InviteDetails } from "@/hooks/use-invite";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { authClient } from "@/lib/auth-client";

const inviteSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export function InviteForm({
  invite,
  token,
}: {
  invite: InviteDetails;
  token: string;
}) {
  const acceptMutation = useAcceptInvite();
  const router = useRouter();

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { name: "", password: "" },
  });

  const onSubmit = async (data: InviteFormValues) => {
    try {
      await acceptMutation.mutateAsync({ token, payload: data });
      toast.success("Account created successfully! Logging you in...");

      // Auto-login after successful registration
      const result = await authClient.signIn.email({
        email: invite.email,
        password: data.password,
      });

      if (result.error) {
        toast.error(
          "Account created, but automatic login failed. Please sign in manually.",
        );
        router.push("/");
        return;
      }

      // Redirect based on role logic
      if (invite.role === "CASHIER") {
        router.push("/cashier/dashboard");
      } else {
        router.push("/manager/dashboard");
      }
    } catch (error) {
      const e = error as AxiosError<{ message: string }>;
      toast.error(e?.response?.data?.message || "Failed to accept invite");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Read-only fields context */}
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1 mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Account Setup For
          </p>
          <p className="text-sm font-bold text-slate-900">{invite.email}</p>
        </div>

        {/* Form Fields */}
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Full Name</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  placeholder="e.g. John Doe"
                  className="h-12 rounded-xl"
                  disabled={acceptMutation.isPending}
                />
              </FieldContent>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Create Password</FieldLabel>
              <FieldContent>
                <PasswordInput
                  {...field}
                  placeholder="At least 8 characters"
                  className="h-12 rounded-xl"
                  disabled={acceptMutation.isPending}
                />
              </FieldContent>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </div>

      <div className="pt-2">
        <SubmitButton
          buttonText="Complete Setup"
          isPending={acceptMutation.isPending}
          className="w-full h-12 rounded-xl text-base font-bold transition-all"
        />
      </div>
    </form>
  );
}
