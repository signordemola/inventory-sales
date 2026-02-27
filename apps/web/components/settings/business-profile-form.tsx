"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  businessProfileSchema,
  BusinessProfileValues,
} from "@/schemas/settings";
import { useBusiness, useUpdateBusiness } from "@/hooks/use-business";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Save,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldContent,
} from "@/components/ui/field";
import Image from "next/image";

export function BusinessProfileForm() {
  const { data: business, isLoading: isFetching } = useBusiness();
  const updateMutation = useUpdateBusiness();

  const form = useForm<BusinessProfileValues>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      logo: "",
    },
  });

  useEffect(() => {
    if (business) {
      form.reset({
        name: business.name || "",
        email: business.email || "",
        phone: business.phone || "",
        address: business.address || "",
        logo: business.logo || "",
      });
    }
  }, [business, form]);
  const logo = useWatch({ control: form.control, name: "logo" });

  const onSubmit = async (data: BusinessProfileValues) => {
    try {
      await updateMutation.mutateAsync(data);
      toast.success("Business profile updated successfully");
    } catch {
      toast.error("Failed to update business profile");
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const isSaving = updateMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <Field>
            <FieldLabel htmlFor="name" className="text-slate-900 font-bold">
              <Building2 className="w-4 h-4 text-primary/60" />
              Business Name
            </FieldLabel>
            <FieldContent>
              <InputGroup className="h-12 bg-slate-50 border-slate-200 focus-within:border-primary/50 focus-within:ring-primary/10 rounded-xl">
                <InputGroupInput
                  id="name"
                  {...form.register("name")}
                  placeholder="e.g. Acme Corp"
                  className="font-semibold text-slate-700"
                />
              </InputGroup>
              <FieldError
                errors={[{ message: form.formState.errors.name?.message }]}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="email" className="text-slate-900 font-bold">
              <Mail className="w-4 h-4 text-primary/60" />
              Business Email
            </FieldLabel>
            <FieldContent>
              <InputGroup className="h-12 bg-slate-50 border-slate-200 focus-within:border-primary/50 focus-within:ring-primary/10 rounded-xl">
                <InputGroupInput
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="contact@business.com"
                  className="font-semibold text-slate-700"
                />
              </InputGroup>
              <FieldError
                errors={[{ message: form.formState.errors.email?.message }]}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="phone" className="text-slate-900 font-bold">
              <Phone className="w-4 h-4 text-primary/60" />
              Phone Number
            </FieldLabel>
            <FieldContent>
              <InputGroup className="h-12 bg-slate-50 border-slate-200 focus-within:border-primary/50 focus-within:ring-primary/10 rounded-xl">
                <InputGroupInput
                  id="phone"
                  {...form.register("phone")}
                  placeholder="+234 ..."
                  className="font-semibold text-slate-700"
                />
              </InputGroup>
              <FieldError
                errors={[{ message: form.formState.errors.phone?.message }]}
              />
            </FieldContent>
          </Field>
        </div>

        <div className="space-y-6">
          <Field className="h-full">
            <FieldLabel htmlFor="address" className="text-slate-900 font-bold">
              <MapPin className="w-4 h-4 text-primary/60" />
              Business Address
            </FieldLabel>
            <FieldContent className="h-full">
              <Textarea
                id="address"
                {...form.register("address")}
                placeholder="Full physical address..."
                className="min-h-[148px] rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:border-primary/50 focus:ring-primary/10 transition-all font-semibold text-slate-700 resize-none"
              />
              <FieldError
                errors={[{ message: form.formState.errors.address?.message }]}
              />
            </FieldContent>
          </Field>

          <div className="pt-2">
            <Field>
              <FieldLabel className="text-slate-900 font-bold">
                <ImageIcon className="w-4 h-4 text-primary/60" />
                Business Logo
              </FieldLabel>
              <div className="mt-2 flex items-center gap-6 p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="w-16 h-16 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm overflow-hidden">
                  {logo ? (
                    <Image
                      src={logo || ""}
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-slate-600 group-hover:text-primary transition-colors">
                    Click to upload logo
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    PNG, JPG up to 5MB
                  </p>
                </div>
              </div>
            </Field>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-slate-100 flex justify-end">
        <Button
          type="submit"
          disabled={isSaving || !form.formState.isDirty}
          className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all gap-2 disabled:opacity-50 disabled:shadow-none"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
