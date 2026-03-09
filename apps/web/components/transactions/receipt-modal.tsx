"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, Loader2 } from "lucide-react";
import { ReceiptTemplate } from "./receipt-template";
import { useDownloadReceipt } from "@/hooks/use-download-receipt";
import { Transaction } from "@/hooks/use-transactions";
import { ReceiptData } from "../pos/payment-types";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | ReceiptData | null;
}

export function ReceiptModal({
  isOpen,
  onClose,
  transaction,
}: ReceiptModalProps) {
  const { downloadReceipt, printReceipt, isGenerating } = useDownloadReceipt();

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-slate-100/50 border-none shadow-2xl p-6 rounded-3xl">
        <DialogHeader className="sr-only">
          <DialogTitle>View Receipt</DialogTitle>
        </DialogHeader>

        <div className="flex justify-center p-4 overflow-y-auto max-h-[60vh] bg-white rounded-2xl relative shadow-inner">
          {isGenerating && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          {/* Render visually */}
          <div className="shadow-lg border border-slate-100 shrink-0">
            <ReceiptTemplate transaction={transaction} isDownloading />
          </div>
        </div>

        <div className="flex justify-center gap-3 mt-4">
          <Button
            variant="outline"
            onClick={() => printReceipt(transaction)}
            disabled={isGenerating}
            className="flex-1 h-12 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Printer className="w-4 h-4 mr-2" />
            )}
            Print Receipt
          </Button>
          <Button
            onClick={() => downloadReceipt(transaction)}
            disabled={isGenerating}
            className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
