"use no memo";
"use client";

import { useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { closeRegisterSchema, CloseRegisterInput } from "@/schemas/shifts";
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
import { Loader2, Banknote, AlertTriangle, CheckCircle2 } from "lucide-react";
import apiClient from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import { AxiosError } from "axios";

interface CloseRegisterModalProps {
  isOpen: boolean;
  expectedCash: number;
  onClose: () => void;
  onSuccess: () => void;
}

import { ZReportModal, ZReportData } from "./z-report-modal";

// --- Main Component ---

export function CloseRegisterModal({
  isOpen,
  expectedCash,
  onClose,
  onSuccess,
}: CloseRegisterModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [zReport, setZReport] = useState<ZReportData | null>(null);

  const form = useForm<CloseRegisterInput>({
    resolver: zodResolver(closeRegisterSchema),
    defaultValues: { actualCash: 0, notes: "" },
  });

  const watchedCash = useWatch({
    control: form.control,
    name: "actualCash",
    defaultValue: 0,
  });

  const actualCash = watchedCash ?? 0;
  const variance = actualCash - expectedCash;
  const hasVariance = actualCash !== 0 && Math.abs(variance) > 0;

  const onSubmit = (values: CloseRegisterInput) => {
    setError("");
    startTransition(async () => {
      try {
        await apiClient.post("/shifts/close", {
          actualCash: values.actualCash,
          notes: values.notes || undefined,
        });

        try {
          const res = await apiClient.get("/shifts/z-report");
          setZReport(res.data);
        } catch {
          onSuccess();
        }
      } catch (err) {
        const e = err as AxiosError<{ message: string }>;
        setError(e?.response?.data?.message || "Failed to close register.");
      }
    });
  };

  const handleDismissReport = () => {
    setZReport(null);
    onSuccess();
  };

  if (zReport) {
    return (
      <ZReportModal
        isOpen={isOpen}
        zReport={zReport}
        onDismiss={handleDismissReport}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
            <Banknote className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle className="text-center text-xl">
            Close Register
          </DialogTitle>
          <DialogDescription className="text-center">
            Count all cash in the drawer and enter the total below. This will
            close your shift.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-2">
          <div className="rounded-lg bg-muted/50 border p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Expected Cash</p>
              <p className="text-lg font-bold text-foreground">
                {formatCurrency(expectedCash)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Starting float + cash sales ± drawer movements
              </p>
            </div>
          </div>

          <FieldGroup>
            <Controller
              name="actualCash"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor={field.name}>
                      Actual Cash in Drawer (₦)
                    </FieldLabel>
                    <Input
                      id={field.name}
                      type="number"
                      min="0"
                      step="0.01"
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                      placeholder="Enter the exact amount you counted"
                      className="text-lg font-bold"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldContent>
                </Field>
              )}
            />

            {hasVariance && (
              <div
                className={`rounded-lg p-3 flex items-center gap-3 border ${
                  variance < 0
                    ? "bg-red-50 border-red-200"
                    : "bg-green-50 border-green-200"
                }`}
              >
                <AlertTriangle
                  className={`h-4 w-4 shrink-0 ${
                    variance < 0 ? "text-red-600" : "text-green-600"
                  }`}
                />
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      variance < 0 ? "text-red-700" : "text-green-700"
                    }`}
                  >
                    {variance < 0 ? "Cash Shortage" : "Cash Overage"}:{" "}
                    {variance < 0 ? "-" : "+"}
                    {formatCurrency(Math.abs(variance))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This variance will be logged in the shift report.
                  </p>
                </div>
              </div>
            )}

            <Controller
              name="notes"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor={field.name}>
                      Notes (optional)
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="e.g. Customer refund caused shortage..."
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldContent>
                </Field>
              )}
            />
          </FieldGroup>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="submit"
              variant="destructive"
              size="lg"
              className="w-full font-bold"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Closing
                  Register...
                </>
              ) : (
                "Close Register & End Shift"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
