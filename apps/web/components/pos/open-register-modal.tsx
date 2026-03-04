"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { openRegisterSchema, OpenRegisterInput } from "@/schemas/shifts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Calculator } from "lucide-react";
import apiClient from "@/lib/axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";

interface OpenRegisterModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export function OpenRegisterModal({
  isOpen,
  onSuccess,
}: OpenRegisterModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const router = useRouter();

  const form = useForm<OpenRegisterInput>({
    resolver: zodResolver(openRegisterSchema),
    defaultValues: { startingCash: 0 },
  });

  const onSubmit = (values: OpenRegisterInput) => {
    setError("");
    startTransition(async () => {
      try {
        await apiClient.post("/shifts/open", {
          startingCash: values.startingCash,
        });
        toast.success("Register opened successfully!");
        onSuccess();
      } catch (err) {
        const e = err as AxiosError<{ message: string }>;
        setError(e?.response?.data?.message || "Failed to open register.");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      {/*
        Prevent closing by clicking outside or pressing escape.
        The shift MUST be opened to use the POS.
      */}
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Calculator className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            Open Register
          </DialogTitle>
          <DialogDescription className="text-center">
            You must declare your starting cash float before you can process any
            sales.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <FieldGroup>
            <Controller
              name="startingCash"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor={field.name}>
                      Starting Cash Float (₦)
                    </FieldLabel>
                    <Input
                      id={field.name}
                      type="number"
                      min="0"
                      step="100"
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                      className="text-lg font-bold"
                      aria-invalid={fieldState.invalid}
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground">
                      Count the physical cash currently in your drawer.
                    </p>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldContent>
                </Field>
              )}
            />
          </FieldGroup>

          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              size="lg"
              disabled={isPending}
              className="w-full font-bold text-background"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening Register...
                </>
              ) : (
                "Open Register & Start Shift"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => router.push("/dashboard")}
            >
              Cancel & Return to Dashboard
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
