"use client";

import { CheckCircle2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PaymentModalState } from "./payment-types";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { ReceiptModal } from "../transactions/receipt-modal";
import { Receipt } from "lucide-react";
import { useState } from "react";

export function PaymentSuccessView({
  state,
  onReset,
}: {
  state: PaymentModalState;
  onReset: () => void;
}) {
  const { isOnline } = useNetworkStatus();
  const [showReceipt, setShowReceipt] = useState(false);

  const isCreditOnly =
    state.payments.length > 0 &&
    state.payments.every((p) => p.method === "CREDIT");
  const hasCash = state.payments.some((p) => p.method === "CASH");

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300 print:bg-white print:static print:h-auto print:block">
      <Card className="w-full max-w-md p-10 flex flex-col items-center text-center space-y-4 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300 print:hidden">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          {isCreditOnly ? "Credit Sale Recorded!" : "Sale Complete!"}
        </h2>
        {state.selectedCustomer && (
          <p className="text-sm font-semibold text-slate-600">
            Credited to{" "}
            <span className="text-primary">{state.selectedCustomer.name}</span>
          </p>
        )}
        {state.localRef && (
          <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-500">
            {state.localRef}
          </span>
        )}

        {/* Change Due — shown prominently for the cashier to hand back */}
        {hasCash && state.changeDue > 0 && (
          <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">
              Change Due
            </p>
            <p className="text-3xl font-black text-emerald-700">
              ₦
              {state.changeDue.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-xs text-emerald-500 mt-1">
              Hand back to the customer
            </p>
          </div>
        )}

        {isOnline ? (
          <p className="text-xs text-slate-400 italic">
            {state.syncedSaleId ? "Synced to server ✓" : "Syncing to server..."}
          </p>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-orange-500 font-semibold">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Saved offline — will sync when back online</span>
          </div>
        )}

        <div className="w-full space-y-2 pt-2">
          {state.receiptData && (
            <Button
              onClick={() => setShowReceipt(true)}
              variant="outline"
              className="w-full h-11 rounded-xl border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
            >
              <Receipt className="w-4 h-4 mr-2" />
              View Receipt
            </Button>
          )}
          <Button
            onClick={onReset}
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            New Sale
          </Button>
        </div>
      </Card>

      <ReceiptModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        transaction={state.receiptData || null}
      />
    </div>
  );
}
