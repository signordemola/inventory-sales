import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Transaction, useVoidSale } from "@/hooks/use-transactions";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmVoidModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export function ConfirmVoidModal({
  transaction,
  onClose,
}: ConfirmVoidModalProps) {
  const { mutateAsync: voidSale, isPending } = useVoidSale();

  const handleConfirm = async () => {
    if (!transaction) return;
    try {
      await voidSale(transaction.id);
      toast.success(`Sale ${transaction.reference} has been voided`);
      onClose();
    } catch (error) {
      const err = error as Error & {
        response?: { data?: { message?: string } };
      };
      toast.error(err.response?.data?.message || "Failed to void transaction");
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={!!transaction} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Void Transaction
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to void transaction{" "}
            <span className="font-bold text-slate-700">
              {transaction.reference}
            </span>
            ? This will reverse the total amount of{" "}
            <span className="font-bold text-slate-700">
              {formatCurrency(transaction.total)}
            </span>{" "}
            and return the items to stock.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-red-50 text-red-800 text-sm p-3 rounded-md mb-2">
          This action cannot be undone. All related records will be marked as
          void.
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
            className="rounded-xl flex items-center gap-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm Void
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
