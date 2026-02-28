"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Banknote, AlertTriangle } from "lucide-react";
import apiClient from "@/lib/axios";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface CloseRegisterModalProps {
  isOpen: boolean;
  expectedCash: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function CloseRegisterModal({
  isOpen,
  expectedCash,
  onClose,
  onSuccess,
}: CloseRegisterModalProps) {
  const [actualCash, setActualCash] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actual = Number(actualCash) || 0;
  const variance = actual - expectedCash;
  const hasVariance = actualCash !== "" && Math.abs(variance) > 0;

  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actualCash === "") {
      toast.error("Please enter the actual cash count.");
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.post("/shifts/close", { actualCash: actual, notes });
      onSuccess();
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(
        axiosError.response?.data?.message || "Failed to close register.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <form onSubmit={handleClose} className="space-y-5 mt-2">
          <div className="rounded-lg bg-muted/50 border p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Expected Cash</p>
              <p className="text-lg font-bold text-foreground">
                {formatCurrency(expectedCash)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Starting float + cash sales
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="actualCash">Actual Cash in Drawer (₦)</Label>
            <Input
              id="actualCash"
              type="number"
              min="0"
              step="0.01"
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
              placeholder="Enter the exact amount you counted"
              className="text-lg font-bold"
              autoFocus
            />
          </div>

          {/* Live variance calculation */}
          {hasVariance && (
            <div
              className={`rounded-lg p-3 flex items-center gap-3 border ${variance < 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}
            >
              <AlertTriangle
                className={`h-4 w-4 shrink-0 ${variance < 0 ? "text-red-600" : "text-green-600"}`}
              />
              <div>
                <p
                  className={`text-sm font-semibold ${variance < 0 ? "text-red-700" : "text-green-700"}`}
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

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Customer refund caused shortage..."
            />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="submit"
              variant="destructive"
              size="lg"
              className="w-full font-bold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
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
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
