"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useReceivePurchaseOrder } from "@/hooks/use-purchase-orders";
import { PurchaseOrder } from "@/types/suppliers";
import { toast } from "sonner";
import { Loader2, PackageCheck } from "lucide-react";

interface ReceivePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder | null;
}

export function ReceivePOModal({
  isOpen,
  onClose,
  purchaseOrder,
}: ReceivePOModalProps) {
  const receivePO = useReceivePurchaseOrder();
  const [receiveQuantities, setReceiveQuantities] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    if (isOpen && purchaseOrder) {
      const initialQuantities: Record<string, number> = {};
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReceiveQuantities(initialQuantities);
    }
  }, [isOpen, purchaseOrder]);

  const handleQuantityChange = (
    itemId: string,
    maxRemaining: number,
    value: number,
  ) => {
    // Ensure we don't receive more than remaining or less than 0
    let safeValue = isNaN(value) ? 0 : value;
    if (safeValue < 0) safeValue = 0;
    if (safeValue > maxRemaining) safeValue = maxRemaining;

    setReceiveQuantities((prev) => ({
      ...prev,
      [itemId]: safeValue,
    }));
  };

  const setReceiveAll = () => {
    if (!purchaseOrder?.items) return;
    const allRemaining: Record<string, number> = {};
    purchaseOrder.items.forEach((item) => {
      allRemaining[item.id] = item.quantity - item.received;
    });
    setReceiveQuantities(allRemaining);
  };

  const handleClose = () => {
    setReceiveQuantities({});
    onClose();
  };

  const handleSubmit = () => {
    if (!purchaseOrder) return;

    // Filter out items where we are receiving 0
    const itemsToReceive = purchaseOrder.items
      ?.filter((item) => receiveQuantities[item.id] > 0)
      .map((item) => ({
        id: item.id,
        receivedQty: receiveQuantities[item.id],
      }));

    if (!itemsToReceive || itemsToReceive.length === 0) {
      toast.error("Please enter quantities to receive for at least one item.");
      return;
    }

    receivePO.mutate(
      { id: purchaseOrder.id, payload: { items: itemsToReceive } },
      {
        onSuccess: () => {
          toast.success("Stock received successfully!");
          handleClose();
        },
        onError: (err) => {
          const error = err as Error & {
            response?: { data?: { message?: string | string[] } };
          };
          const msg =
            error.response?.data?.message || "Failed to receive stock.";
          toast.error(typeof msg === "string" ? msg : msg[0]);
        },
      },
    );
  };

  if (!purchaseOrder) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="size-5 text-primary" />
            Receive Stock: {purchaseOrder.reference}
          </DialogTitle>
          <DialogDescription>
            Enter the quantities received for each line item. This will
            automatically increase your overall product stock.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border">
            <div>
              <p className="text-sm font-bold m-0">
                {purchaseOrder.supplier?.name}
              </p>
              <p className="text-xs text-slate-500 m-0">
                Reference: {purchaseOrder.reference}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={setReceiveAll}
              className="h-8 text-xs"
            >
              Receive Remaining
            </Button>
          </div>

          <div className="border rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase text-slate-500">
                    Product
                  </TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase text-slate-500">
                    Ordered
                  </TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase text-slate-500">
                    Received
                  </TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase text-primary">
                    Receive Now
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrder.items?.map((item) => {
                  const remaining = item.quantity - item.received;
                  const isFullyReceived = remaining === 0;

                  return (
                    <TableRow
                      key={item.id}
                      className={
                        isFullyReceived
                          ? "bg-slate-50/50 opacity-60 hover:bg-slate-50/50"
                          : ""
                      }
                    >
                      <TableCell>
                        <p className="font-bold text-slate-900">
                          {item.product?.name || "Unknown Product"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.product?.sku}
                        </p>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs font-bold">
                          {item.received}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {isFullyReceived ? (
                          <span className="text-xs font-bold text-slate-400 italic">
                            Completed
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              Max {remaining}
                            </span>
                            <Input
                              type="number"
                              min="0"
                              max={remaining}
                              className="w-20 h-8 text-right font-bold border-primary/30 focus-visible:ring-primary/20"
                              value={receiveQuantities[item.id] || 0}
                              onChange={(e) =>
                                handleQuantityChange(
                                  item.id,
                                  remaining,
                                  parseInt(e.target.value),
                                )
                              }
                            />
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={receivePO.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={receivePO.isPending}>
            {receivePO.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Confirm Receiving
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
