"use client";

import { useState } from "react";
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
  ChevronLeft,
  User,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CartItem } from "./cart-panel";
import { CustomerPicker } from "./customer-picker";
import { toast } from "sonner";
import { createSaleOffline, CreateSaleOfflineInput } from "@/lib/offline/sales";
import { PendingPaymentMethod, LocalCustomer } from "@/lib/db";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  vat: number;
  total: number;
  onSuccess: () => void;
  userRole?: string;
}

type Step = "method" | "customer" | "confirm";

export const PaymentModal = ({
  isOpen,
  onClose,
  items,
  total,
  subtotal,
  onSuccess,
  userRole,
}: PaymentModalProps) => {
  const [selectedMethod, setSelectedMethod] =
    useState<PendingPaymentMethod>("CASH");
  const [step, setStep] = useState<Step>("method");
  const [selectedCustomer, setSelectedCustomer] =
    useState<LocalCustomer | null>(null);
  const [creditDueDate, setCreditDueDate] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [localRef, setLocalRef] = useState<string | null>(null);
  const [syncedSaleId, setSyncedSaleId] = useState<string | null>(null);

  const handleReset = () => {
    setIsSuccess(false);
    setStep("method");
    setSelectedCustomer(null);
    setCreditDueDate("");
    setSyncedSaleId(null);
    setLocalRef(null);
    onSuccess();
    onClose();
  };

  const handleDownloadReceipt = () => {
    if (syncedSaleId) {
      window.open(`/api/v1/sales/${syncedSaleId}/receipt`, "_blank");
    }
  };

  if (!isOpen) return null;

  const handleMethodSelect = (method: PendingPaymentMethod) => {
    setSelectedMethod(method);
    if (method === "CREDIT") {
      setStep("customer");
    }
  };

  const handleCustomerSelect = (customer: LocalCustomer) => {
    setSelectedCustomer(customer);
    setStep("method");
  };

  const handleConfirmPayment = async () => {
    if (selectedMethod === "CREDIT" && !selectedCustomer) {
      toast.error("Select a customer for credit sales");
      setStep("customer");
      return;
    }

    setIsProcessing(true);

    const input: CreateSaleOfflineInput = {
      items: items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.product.sellingPrice),
        total: item.quantity * Number(item.product.sellingPrice),
      })),
      payments: [{ method: selectedMethod, amount: total }],
      subtotal,
      total,
      discount: 0,
      customerId: selectedCustomer?.id,
      creditDueDate: creditDueDate || undefined,
    };

    try {
      const { localReference } = await createSaleOffline(input);
      setLocalRef(localReference);
      setIsSuccess(true);

      // Try to flush queue immediately if online to get the real server ID
      if (navigator.onLine) {
        const { flushSyncQueue } = await import("@/lib/offline/flushSyncQueue");
        await flushSyncQueue();

        // After flush, look up the record in Dexie by localReference to get the serverId
        const { db } = await import("@/lib/db");
        const synced = await db.pendingSales
          .filter((s) => s.localReference === localReference)
          .first();

        if (synced?.serverId) {
          setSyncedSaleId(synced.serverId);

          // Silently trigger Cloudinary PDF generation and storage on the server
          import("@/lib/axios").then(({ default: apiClient }) => {
            apiClient
              .post(`/sales/${synced.serverId}/receipt/store`)
              .catch((err: unknown) => {
                console.error(
                  "Failed to automatically store receipt to Cloudinary:",
                  err,
                );
              });
          });
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Sale failed", {
        description:
          "There was an error recording the transaction. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

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

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
        <Card className="w-full max-w-md p-10 flex flex-col items-center text-center space-y-4 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {selectedMethod === "CREDIT"
              ? "Credit Sale Recorded!"
              : "Sale Complete!"}
          </h2>
          {selectedCustomer && (
            <p className="text-sm font-semibold text-slate-600">
              Credited to{" "}
              <span className="text-primary">{selectedCustomer.name}</span>
            </p>
          )}
          {localRef && (
            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-500">
              {localRef}
            </span>
          )}
          <p className="text-xs text-slate-400 italic">
            {navigator.onLine
              ? syncedSaleId
                ? "Synced to server ✓"
                : "Syncing to server..."
              : "Will sync when back online."}
          </p>

          <div className="w-full space-y-2 pt-2">
            {syncedSaleId && (
              <Button
                onClick={handleDownloadReceipt}
                variant="outline"
                className="w-full h-11 rounded-xl border-slate-200 font-bold text-slate-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
            )}
            <Button
              onClick={handleReset}
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              New Sale
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl bg-white dark:bg-slate-950 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {step === "customer" && (
              <button
                onClick={() => setStep("method")}
                className="text-slate-400 hover:text-slate-600 mr-1"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {step === "customer"
                ? "Select Customer"
                : "Select Payment Method"}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full text-slate-400"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-8 space-y-6">
          {/* Amount */}
          <div className="text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Amount Due
            </p>
            <h2 className="text-5xl font-black text-slate-900 dark:text-emerald-400 tracking-tighter">
              ₦{total.toLocaleString()}
            </h2>
          </div>

          {/* Customer picker step */}
          {step === "customer" ? (
            <CustomerPicker
              onSelect={handleCustomerSelect}
              onCancel={() => {
                setSelectedMethod("CASH");
                setStep("method");
              }}
            />
          ) : (
            <>
              {/* Selected customer badge */}
              {selectedMethod === "CREDIT" && selectedCustomer && (
                <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-slate-900">
                      {selectedCustomer.name}
                    </span>
                    {selectedCustomer.phone && (
                      <span className="text-xs text-slate-400">
                        {selectedCustomer.phone}
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
                        selectedMethod === method.id
                          ? "border-primary bg-primary/5 shadow-inner"
                          : "border-slate-100 dark:border-slate-800 hover:border-primary/50 hover:bg-slate-50"
                      }`}
                      onClick={() => handleMethodSelect(method.id)}
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
                            : "text-slate-400 group-hover:text-slate-900"
                        }`}
                      />
                      <span
                        className={`font-bold text-sm ${selectedMethod === method.id ? "text-slate-900 dark:text-white" : "text-slate-500"}`}
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
              {selectedMethod === "CASH" && (
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 block mb-2">
                    Cash Tendered
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter amount..."
                    className="h-12 text-lg font-bold rounded-xl border-slate-200"
                  />
                </div>
              )}

              {/* Credit due date */}
              {selectedMethod === "CREDIT" && selectedCustomer && (
                <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-bold text-amber-600 uppercase tracking-widest pl-1 block mb-2">
                    Due Date (optional)
                  </label>
                  <Input
                    type="date"
                    value={creditDueDate}
                    onChange={(e) => setCreditDueDate(e.target.value)}
                    className="h-10 rounded-xl border-amber-200 bg-white text-sm"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {step !== "customer" && (
          <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between px-8">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <Lock className="w-3.5 h-3.5" />
              {navigator.onLine ? "SECURE TRANSACTION" : "OFFLINE — WILL SYNC"}
            </div>
            <Button
              className="w-full md:w-auto min-w-[200px] h-14 rounded-xl bg-primary hover:bg-primary-hover text-slate-950 font-black text-lg shadow-lg shadow-primary/20 transition-all"
              onClick={handleConfirmPayment}
              disabled={
                isProcessing ||
                (selectedMethod === "CREDIT" && !selectedCustomer)
              }
            >
              {isProcessing
                ? "Processing..."
                : selectedMethod === "CREDIT" && !selectedCustomer
                  ? "Select Customer First"
                  : "Complete Sale"}
              {!isProcessing && <ArrowRight className="ml-2 w-5 h-5" />}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
