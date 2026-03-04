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

type ZReportData = {
  startingCash: number;
  totalRevenue: number;
  transactionCount: number;
  salesByMethod: Record<string, number>;
  totalPaidIn: number;
  totalPaidOut: number;
  expectedCash: number;
  actualCash: number | null;
  variance: number | null;
};

// --- Subcomponents ---

function ZReportView({
  isOpen,
  zReport,
  onDismiss,
}: {
  isOpen: boolean;
  zReport: ZReportData;
  onDismiss: () => void;
}) {
  const varianceVal = zReport.variance ?? 0;
  const methodLabels: Record<string, string> = {
    CASH: "Cash",
    CARD: "Card",
    TRANSFER: "Transfer",
    PAYSTACK: "Paystack",
    CREDIT: "Credit",
  };

  return (
    <Dialog open={isOpen} onOpenChange={onDismiss}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 mb-4">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <DialogTitle className="text-center text-xl">
            Shift Closed — Z-Report
          </DialogTitle>
          <DialogDescription className="text-center">
            Summary of your completed shift
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 border p-3 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Total Revenue
              </p>
              <p className="text-xl font-black text-slate-900">
                {formatCurrency(zReport.totalRevenue)}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 border p-3 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Transactions
              </p>
              <p className="text-xl font-black text-slate-900">
                {zReport.transactionCount}
              </p>
            </div>
          </div>

          {Object.keys(zReport.salesByMethod).length > 0 && (
            <div className="rounded-lg border p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Sales by Payment Method
              </p>
              <div className="space-y-1.5">
                {Object.entries(zReport.salesByMethod).map(
                  ([method, amount]) => (
                    <div key={method} className="flex justify-between text-sm">
                      <span className="text-slate-600">
                        {methodLabels[method] || method}
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {(zReport.totalPaidIn > 0 || zReport.totalPaidOut > 0) && (
            <div className="rounded-lg border p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Drawer Movements
              </p>
              <div className="space-y-1.5">
                {zReport.totalPaidIn > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600">Cash In</span>
                    <span className="font-bold text-emerald-700">
                      +{formatCurrency(zReport.totalPaidIn)}
                    </span>
                  </div>
                )}
                {zReport.totalPaidOut > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">Cash Out</span>
                    <span className="font-bold text-red-700">
                      −{formatCurrency(zReport.totalPaidOut)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="rounded-lg border p-3 space-y-1.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Cash Reconciliation
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Starting Float</span>
              <span className="font-semibold">
                {formatCurrency(zReport.startingCash)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Expected Cash</span>
              <span className="font-semibold">
                {formatCurrency(zReport.expectedCash)}
              </span>
            </div>
            {zReport.actualCash !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Actual Cash</span>
                <span className="font-semibold">
                  {formatCurrency(zReport.actualCash)}
                </span>
              </div>
            )}
            {varianceVal !== 0 && (
              <div
                className={`flex justify-between text-sm font-bold pt-1 border-t ${
                  varianceVal < 0 ? "text-red-600" : "text-emerald-600"
                }`}
              >
                <span>{varianceVal < 0 ? "Shortage" : "Overage"}</span>
                <span>
                  {varianceVal < 0 ? "−" : "+"}
                  {formatCurrency(Math.abs(varianceVal))}
                </span>
              </div>
            )}
            {varianceVal === 0 && (
              <div className="flex justify-between text-sm font-bold pt-1 border-t text-emerald-600">
                <span>Variance</span>
                <span>₦0.00 ✓</span>
              </div>
            )}
          </div>

          <Button
            onClick={onDismiss}
            className="w-full h-11 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
      <ZReportView
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
