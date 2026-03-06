import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Transaction,
  TransactionItem,
  useReturnSale,
} from "@/hooks/use-transactions";
import { toast } from "sonner";
import { Loader2, Minus, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ReturnSaleModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export function ReturnSaleModal({
  transaction,
  onClose,
}: ReturnSaleModalProps) {
  const { mutateAsync: returnSale, isPending } = useReturnSale();

  // State to track quantities to return for each item
  const [returnQuantities, setReturnQuantities] = useState<
    Record<string, number>
  >({});

  // Reset state when transaction changes
  React.useEffect(() => {
    setReturnQuantities({});
  }, [transaction]);

  const handleConfirm = async () => {
    if (!transaction) return;

    const itemsToReturn = Object.entries(returnQuantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([saleItemId, quantity]) => ({ saleItemId, quantity }));

    if (itemsToReturn.length === 0) {
      toast.error("Please select at least one item to return");
      return;
    }

    try {
      await returnSale({ saleId: transaction.id, items: itemsToReturn });
      toast.success(
        `Successfully processed return for ${transaction.reference}`,
      );
      onClose();
    } catch (err) {
      const error = err as Error & {
        response?: { data?: { message?: string } };
      };
      toast.error(error.response?.data?.message || "Failed to process return");
    }
  };

  const updateQuantity = (saleItemId: string, change: number, max: number) => {
    setReturnQuantities((prev) => {
      const current = prev[saleItemId] || 0;
      const next = Math.max(0, Math.min(max, current + change));
      return { ...prev, [saleItemId]: next };
    });
  };

  if (!transaction) return null;

  const totalReturnAmount = transaction.items.reduce((acc, item) => {
    const qty = returnQuantities[item.id] || 0;
    return acc + qty * item.unitPrice;
  }, 0);

  return (
    <Dialog open={!!transaction} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Process Return</DialogTitle>
          <DialogDescription>
            Select the items and quantities to return for transaction{" "}
            <span className="font-bold text-slate-700">
              {transaction.reference}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-4">
          {transaction.items.map((item) => {
            // Suppose item has a 'returned' field via relation, but TransactionItem doesn't officially expose it yet in UI type.
            // If the typed model has 'returned', we'll use it. Otherwise, we assume 0 returned so far.
            const returnedSoFar =
              (item as TransactionItem & { returned?: number }).returned || 0;
            const remaining = item.quantity - returnedSoFar;

            if (remaining <= 0) return null;

            const qtyToReturn = returnQuantities[item.id] || 0;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50"
              >
                <div>
                  <p className="font-semibold text-slate-900 text-sm">
                    {item.product?.name || "Unknown Product"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatCurrency(item.unitPrice)} each · Max: {remaining}
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-1">
                  <button
                    onClick={() => updateQuantity(item.id, -1, remaining)}
                    disabled={qtyToReturn === 0}
                    className="w-8 h-8 rounded-md flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-semibold text-sm">
                    {qtyToReturn}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1, remaining)}
                    disabled={qtyToReturn === remaining}
                    className="w-8 h-8 rounded-md flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {transaction.items.every(
            (item) =>
              item.quantity -
                ((item as TransactionItem & { returned?: number }).returned ||
                  0) <=
              0,
          ) && (
            <div className="text-center py-8 text-slate-500 text-sm">
              All items in this transaction have already been returned.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 mt-4 pt-4 mb-4">
          <span className="font-semibold text-slate-600">Total Refund:</span>
          <span className="text-xl font-bold text-slate-900">
            {formatCurrency(totalReturnAmount)}
          </span>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-auto">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending || totalReturnAmount === 0}
            className="rounded-xl flex items-center gap-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Process Refund
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
