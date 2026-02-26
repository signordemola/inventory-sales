"use client";

import React, { useState } from "react";
import {
  X,
  Banknote,
  CreditCard,
  Send,
  ShieldCheck,
  Lock,
  ArrowRight,
  Ban,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useCreateSale,
  CreateSalePayload,
  CreatePayment,
} from "@/hooks/use-sales";
import { CartItem } from "./cart-panel";
import { toast } from "sonner";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  vat: number;
  total: number;
  onSuccess: () => void;
}

export const PaymentModal = ({
  isOpen,
  onClose,
  items,
  total,
  onSuccess,
}: PaymentModalProps) => {
  const [selectedMethod, setSelectedMethod] =
    useState<CreatePayment["method"]>("CASH");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const createSale = useCreateSale();

  if (!isOpen) return null;

  const handleConfirmPayment = async () => {
    setIsProcessing(true);

    const payload: CreateSalePayload = {
      items: items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: Number(item.product.salePrice),
      })),
      payments: [
        {
          method: selectedMethod,
          amount: total,
        },
      ],
    };

    try {
      await createSale.mutateAsync(payload);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.log(error);
      toast.error("Sale failed", {
        description:
          "There was an error processing the transaction. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const methods = [
    {
      id: "CASH",
      label: "Cash",
      icon: Banknote,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    {
      id: "CARD",
      label: "Card",
      icon: CreditCard,
      color: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      id: "TRANSFER",
      label: "Transfer",
      icon: Send,
      color: "bg-purple-50 text-purple-600 border-purple-100",
    },
    {
      id: "PAYSTACK",
      label: "Paystack",
      icon: ShieldCheck,
      color: "bg-teal-50 text-teal-600 border-teal-100",
    },
    {
      id: "CREDIT",
      label: "Credit Sale",
      icon: Lock,
      color: "bg-amber-50 text-amber-600 border-amber-100",
      admin: true,
    },
  ];

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
        <Card className="w-full max-w-md p-12 flex flex-col items-center text-center space-y-4 rounded-3xl shadow-2xl scale-100 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            Sale Confirmed!
          </h2>
          <p className="text-slate-500 font-medium italic">
            Printing receipt...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl bg-white dark:bg-slate-950 rounded-3xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Select Payment Method
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full text-slate-400"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-8 space-y-8">
          <div className="text-center space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Amount Due
            </p>
            <h2 className="text-5xl font-black text-slate-900 dark:text-emerald-400 tracking-tighter">
              ₦{total.toLocaleString()}
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {methods.map((method) => (
              <button
                key={method.id}
                className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all group relative overflow-hidden ${
                  selectedMethod === method.id
                    ? "border-primary bg-primary/5 shadow-inner"
                    : "border-slate-100 dark:border-slate-800 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                }`}
                onClick={() =>
                  setSelectedMethod(method.id as CreatePayment["method"])
                }
              >
                {method.admin && (
                  <div className="absolute top-0 right-0 bg-amber-400 text-[8px] font-black px-2 py-0.5 rounded-bl-lg text-slate-900">
                    ADMIN
                  </div>
                )}
                <method.icon
                  className={`w-8 h-8 transition-transform group-hover:scale-110 ${
                    selectedMethod === method.id
                      ? "text-primary"
                      : "text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                  }`}
                />
                <span
                  className={`font-bold text-sm ${
                    selectedMethod === method.id
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-500"
                  }`}
                >
                  {method.label}
                </span>
              </button>
            ))}

            <button
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all group text-slate-400 hover:text-red-500"
              onClick={onClose}
            >
              <Ban className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm">Cancel Sale</span>
            </button>
          </div>

          {selectedMethod === "CASH" && (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                  Cash Tendered
                </label>
                <Input
                  type="number"
                  placeholder="Enter amount..."
                  className="h-12 text-lg font-bold rounded-xl border-slate-200 focus:ring-primary"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between px-8">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <Lock className="w-3.5 h-3.5" />
            SECURE TRANSACTION
          </div>
          <Button
            className="w-full md:w-auto min-w-[200px] h-14 rounded-xl bg-primary hover:bg-primary-hover text-slate-950 font-black text-lg shadow-lg shadow-primary/20 transition-all"
            onClick={handleConfirmPayment}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Complete Sale"}
            {!isProcessing && <ArrowRight className="ml-2 w-5 h-5" />}
          </Button>
        </div>
      </Card>
    </div>
  );
};
