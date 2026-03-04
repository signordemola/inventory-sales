"use client";

import { useState } from "react";
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
import { Loader2, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import apiClient from "@/lib/axios";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface DrawerMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type MovementType = "PAID_IN" | "PAID_OUT";

export function DrawerMovementModal({
  isOpen,
  onClose,
  onSuccess,
}: DrawerMovementModalProps) {
  const [type, setType] = useState<MovementType>("PAID_IN");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const parsedAmount = Number(amount);
  const isValid = parsedAmount > 0 && reason.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    setError("");

    try {
      await apiClient.post("/shifts/drawer-movement", {
        type,
        amount: parsedAmount,
        reason: reason.trim(),
      });

      toast.success(
        type === "PAID_IN"
          ? `${formatCurrency(parsedAmount)} added to drawer`
          : `${formatCurrency(parsedAmount)} removed from drawer`,
      );

      setAmount("");
      setReason("");
      onSuccess();
      onClose();
    } catch {
      setError("Failed to record movement. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAmount("");
    setReason("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Cash Drawer Movement
          </DialogTitle>
          <DialogDescription className="text-center">
            Record cash added to or removed from the register.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType("PAID_IN")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                type === "PAID_IN"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 text-slate-400 hover:border-slate-300"
              }`}
            >
              <ArrowDownToLine className="w-6 h-6" />
              <span className="font-bold text-sm">Cash In</span>
              <span className="text-[10px] leading-tight">
                Add money to drawer
              </span>
            </button>
            <button
              type="button"
              onClick={() => setType("PAID_OUT")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                type === "PAID_OUT"
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-slate-200 text-slate-400 hover:border-slate-300"
              }`}
            >
              <ArrowUpFromLine className="w-6 h-6" />
              <span className="font-bold text-sm">Cash Out</span>
              <span className="text-[10px] leading-tight">
                Remove from drawer
              </span>
            </button>
          </div>

          <FieldGroup>
            <Field>
              <FieldLabel>Amount (₦)</FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="h-12 text-lg font-bold"
                />
              </FieldContent>
              {amount && parsedAmount <= 0 && (
                <FieldError>Amount must be greater than zero</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel>Reason</FieldLabel>
              <FieldContent>
                <Input
                  placeholder={
                    type === "PAID_IN"
                      ? "e.g. Change top-up, float adjustment"
                      : "e.g. Petty cash, vendor payment"
                  }
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="h-10"
                />
              </FieldContent>
              {reason.length === 0 && amount && (
                <FieldError>Reason is required</FieldError>
              )}
            </Field>
          </FieldGroup>

          {error && (
            <p className="text-sm text-red-500 font-medium text-center">
              {error}
            </p>
          )}

          {/* Preview */}
          {isValid && (
            <div
              className={`rounded-xl p-4 text-center ${
                type === "PAID_IN"
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                {type === "PAID_IN"
                  ? "Adding to Drawer"
                  : "Removing from Drawer"}
              </p>
              <p
                className={`text-2xl font-black ${
                  type === "PAID_IN" ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {type === "PAID_IN" ? "+" : "−"}
                {formatCurrency(parsedAmount)}
              </p>
              <p className="text-xs text-slate-500 mt-1">{reason}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-11 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              className={`flex-1 h-11 rounded-xl font-bold ${
                type === "PAID_IN"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
              } text-white`}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                `Confirm ${type === "PAID_IN" ? "Cash In" : "Cash Out"}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
