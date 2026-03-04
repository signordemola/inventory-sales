"use client";

import {
  Banknote,
  CreditCard,
  Send,
  ShieldCheck,
  Lock,
  Ban,
  User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { PendingPaymentMethod } from "@/lib/db";
import { PaymentModalState, Step } from "./payment-types";

export function PaymentMethodSelector({
  state,
  total,
  userRole,
  onMethodSelect,
  setStep,
  setAmountTendered,
  setCreditDueDate,
  onClose,
}: {
  state: PaymentModalState;
  total: number;
  userRole?: string;
  onMethodSelect: (id: PendingPaymentMethod) => void;
  setStep: (step: Step) => void;
  setAmountTendered: (amount: string) => void;
  setCreditDueDate: (date: string) => void;
  onClose: () => void;
}) {
  const methods = [
    { id: "CASH" as PendingPaymentMethod, label: "Cash", icon: Banknote },
    { id: "CARD" as PendingPaymentMethod, label: "Card", icon: CreditCard },
    { id: "TRANSFER" as PendingPaymentMethod, label: "Transfer", icon: Send },
    {
      id: "PAYSTACK" as PendingPaymentMethod,
      label: "Paystack",
      icon: ShieldCheck,
    },
    {
      id: "CREDIT" as PendingPaymentMethod,
      label: "Credit Sale",
      icon: Lock,
      admin: true,
    },
  ];

  return (
    <>
      {/* Selected customer badge */}
      {state.selectedMethod === "CREDIT" && state.selectedCustomer && (
        <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-slate-900">
              {state.selectedCustomer.name}
            </span>
            {state.selectedCustomer.phone && (
              <span className="text-xs text-slate-400">
                {state.selectedCustomer.phone}
              </span>
            )}
          </div>
          <button
            className="text-xs text-primary font-semibold hover:underline"
            onClick={() => setStep("customer")}
          >
            Change
          </button>
        </div>
      )}

      {/* Method grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {methods.map((method) => {
          if (method.admin && userRole === "CASHIER") return null;
          return (
            <button
              key={method.id}
              className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all group relative overflow-hidden ${
                state.selectedMethod === method.id
                  ? "border-primary bg-primary/5 shadow-inner"
                  : "border-slate-100 dark:border-slate-800 hover:border-primary/50 hover:bg-slate-50"
              }`}
              onClick={() => onMethodSelect(method.id)}
            >
              {method.admin && (
                <div className="absolute top-0 right-0 bg-amber-400 text-[8px] font-black px-2 py-0.5 rounded-bl-lg text-slate-900">
                  ADMIN
                </div>
              )}
              <method.icon
                className={`w-8 h-8 transition-transform group-hover:scale-110 ${
                  state.selectedMethod === method.id
                    ? "text-primary"
                    : "text-slate-400 group-hover:text-slate-900"
                }`}
              />
              <span
                className={`font-bold text-sm ${
                  state.selectedMethod === method.id
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-500"
                }`}
              >
                {method.label}
              </span>
            </button>
          );
        })}
        <button
          className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-100 hover:border-red-400 hover:bg-red-50 transition-all group text-slate-400 hover:text-red-500"
          onClick={onClose}
        >
          <Ban className="w-8 h-8 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-sm">Cancel Sale</span>
        </button>
      </div>

      {/* Cash tendered */}
      {state.selectedMethod === "CASH" && (
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 animate-in slide-in-from-top-2 duration-300">
          <label
            htmlFor="cash-tendered"
            className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 block mb-2"
          >
            Cash Tendered
          </label>
          <Input
            id="cash-tendered"
            type="number"
            placeholder="Enter amount..."
            value={state.amountTendered}
            onChange={(e) => setAmountTendered(e.target.value)}
            className="h-12 text-lg font-bold rounded-xl border-slate-200 focus-visible:ring-primary/20"
          />
          {state.amountTendered && Number(state.amountTendered) < total && (
            <p className="text-xs text-red-500 font-bold mt-2 pl-1">
              Insufficient amount
            </p>
          )}
          {state.amountTendered && Number(state.amountTendered) >= total && (
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-500">
                Change Due
              </span>
              <span className="text-lg font-black text-emerald-600">
                ₦{(Number(state.amountTendered) - total).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Credit due date */}
      {state.selectedMethod === "CREDIT" && state.selectedCustomer && (
        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 animate-in slide-in-from-top-2 duration-300">
          <label
            htmlFor="credit-due-date"
            className="text-[10px] font-bold text-amber-600 uppercase tracking-widest pl-1 block mb-2"
          >
            Due Date (optional)
          </label>
          <Input
            id="credit-due-date"
            type="date"
            value={state.creditDueDate}
            onChange={(e) => setCreditDueDate(e.target.value)}
            className="h-10 rounded-xl border-amber-200 bg-white text-sm"
            min={new Date().toISOString().split("T")[0]}
          />
        </div>
      )}
    </>
  );
}
