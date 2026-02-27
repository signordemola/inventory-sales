"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { paymentSchema, PaymentFormData } from "@/schemas/suppliers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSupplierPayment } from "@/hooks/use-supplier-payments";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Supplier, SupplierBalance } from "@/types/suppliers";

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier;
  balance: SupplierBalance;
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  supplier,
  balance,
}: RecordPaymentModalProps) {
  const createPayment = useCreateSupplierPayment();
  const isPending = createPayment.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      notes: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ amount: 0, notes: "" });
    }
  }, [isOpen, reset]);

  const onSubmit = (data: PaymentFormData) => {
    if (data.amount > balance.balance) {
      toast.error("Cannot pay more than the outstanding balance.");
      return;
    }

    createPayment.mutate(
      { id: supplier.id, payload: data },
      {
        onSuccess: () => {
          toast.success("Payment recorded successfully");
          onClose();
        },
        onError: () => toast.error("Failed to record payment"),
      },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Supplier Payment</DialogTitle>
          <DialogDescription>
            Record a cash or bank transfer payment made to {supplier.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg my-2 flex justify-between items-center">
          <span className="text-sm font-medium text-slate-500">
            Outstanding Balance:
          </span>
          <span className="text-lg font-black text-slate-900">
            ₦{balance.balance.toLocaleString()}
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount (₦) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-xs text-red-500">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes/Reference (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Bank transfer ref 123..."
              className="resize-none"
              {...register("notes")}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || balance.balance <= 0}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
