"use client";

import { useEffect } from "react";
import {
  Customer,
  useCreateCustomer,
  useUpdateCustomer,
} from "@/hooks/use-customers";
import { X, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required."),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

type CustomerInput = z.infer<typeof customerSchema>;

interface CustomerEditorProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
}

export const CustomerEditor = ({
  isOpen,
  onClose,
  customer,
}: CustomerEditorProps) => {
  const isCreating = !customer;
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer(customer?.id);

  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
    },
  });

  useEffect(() => {
    queueMicrotask(() => {
      if (isOpen) {
        form.reset({
          name: customer?.name || "",
          phone: customer?.phone || "",
          email: customer?.email || "",
        });
      }
    });
  }, [isOpen, customer, form]);

  const onSubmit = async (data: CustomerInput) => {
    const payload = {
      name: data.name,
      phone: data.phone?.trim() || undefined,
      email: data.email?.trim() || undefined,
    };

    try {
      if (isCreating) {
        await createMutation.mutateAsync(payload);
        toast.success("Customer created successfully");
      } else if (customer) {
        await updateMutation.mutateAsync(payload);
        toast.success("Customer updated");
      }
      onClose();
    } catch (error) {
      const e = error as AxiosError<{ message: string }>;
      toast.error(e?.response?.data?.message || "Failed to save customer");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform border-l border-slate-100">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {isCreating ? "Add New Customer" : "Edit Customer"}
              </h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {isCreating ? "Create Profile" : customer?.id.slice(-8)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel
                        className="text-sm font-bold text-slate-700"
                        htmlFor={field.name}
                      >
                        Full Name <span className="text-red-500">*</span>
                      </FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        placeholder="e.g. Jane Doe"
                        aria-invalid={fieldState.invalid}
                        className="h-11 rounded-xl bg-slate-50 border-slate-200 font-medium transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </FieldContent>
                  </Field>
                )}
              />

              <Controller
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel
                        className="text-sm font-bold text-slate-700"
                        htmlFor={field.name}
                      >
                        Phone Number
                      </FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        placeholder="e.g. 08012345678"
                        aria-invalid={fieldState.invalid}
                        className="h-11 rounded-xl bg-slate-50 border-slate-200 font-medium transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </FieldContent>
                  </Field>
                )}
              />

              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel
                        className="text-sm font-bold text-slate-700"
                        htmlFor={field.name}
                      >
                        Email Address
                      </FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        type="email"
                        placeholder="e.g. jane@example.com"
                        aria-invalid={fieldState.invalid}
                        className="h-11 rounded-xl bg-slate-50 border-slate-200 font-medium transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </FieldContent>
                  </Field>
                )}
              />
            </FieldGroup>
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 px-6 rounded-xl font-bold bg-white"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-11 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-sm"
              disabled={isPending}
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};
