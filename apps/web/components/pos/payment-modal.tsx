"use client";

import { useReducer } from "react";
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
import { useQueryClient } from "@tanstack/react-query";

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

type PaymentModalState = {
  selectedMethod: PendingPaymentMethod;
  step: Step;
  selectedCustomer: LocalCustomer | null;
  creditDueDate: string;
  isProcessing: boolean;
  isSuccess: boolean;
  localRef: string | null;
  syncedSaleId: string | null;
  amountTendered: string;
  changeDue: number;
};

type PaymentModalAction =
  | { type: "SET_METHOD"; payload: PendingPaymentMethod }
  | { type: "SET_STEP"; payload: Step }
  | { type: "SET_CUSTOMER"; payload: LocalCustomer | null }
  | { type: "SET_CREDIT_DUE_DATE"; payload: string }
  | { type: "SET_PROCESSING"; payload: boolean }
  | {
      type: "SET_SUCCESS";
      payload: { localRef: string; changeDue: number };
    }
  | { type: "SET_SYNCED_ID"; payload: string }
  | { type: "SET_AMOUNT_TENDERED"; payload: string }
  | { type: "RESET" };

const initialState: PaymentModalState = {
  selectedMethod: "CASH",
  step: "method",
  selectedCustomer: null,
  creditDueDate: "",
  isProcessing: false,
  isSuccess: false,
  localRef: null,
  syncedSaleId: null,
  amountTendered: "",
  changeDue: 0,
};

function reducer(
  state: PaymentModalState,
  action: PaymentModalAction,
): PaymentModalState {
  switch (action.type) {
    case "SET_METHOD":
      return { ...state, selectedMethod: action.payload };
    case "SET_STEP":
      return { ...state, step: action.payload };
    case "SET_CUSTOMER":
      return { ...state, selectedCustomer: action.payload };
    case "SET_CREDIT_DUE_DATE":
      return { ...state, creditDueDate: action.payload };
    case "SET_PROCESSING":
      return { ...state, isProcessing: action.payload };
    case "SET_SUCCESS":
      return {
        ...state,
        isSuccess: true,
        localRef: action.payload.localRef,
        changeDue: action.payload.changeDue,
      };
    case "SET_SYNCED_ID":
      return { ...state, syncedSaleId: action.payload };
    case "SET_AMOUNT_TENDERED":
      return { ...state, amountTendered: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

// --- Subcomponents ---

function PaymentSuccessView({
  state,
  onReset,
  onDownloadReceipt,
}: {
  state: PaymentModalState;
  onReset: () => void;
  onDownloadReceipt: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
      <Card className="w-full max-w-md p-10 flex flex-col items-center text-center space-y-4 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          {state.selectedMethod === "CREDIT"
            ? "Credit Sale Recorded!"
            : "Sale Complete!"}
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
        {state.selectedMethod === "CASH" && state.changeDue > 0 && (
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

        <p className="text-xs text-slate-400 italic">
          {typeof window !== "undefined" && navigator.onLine
            ? state.syncedSaleId
              ? "Synced to server ✓"
              : "Syncing to server..."
            : "Will sync when back online."}
        </p>

        <div className="w-full space-y-2 pt-2">
          {state.syncedSaleId && (
            <Button
              onClick={onDownloadReceipt}
              variant="outline"
              className="w-full h-11 rounded-xl border-slate-200 font-bold text-slate-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Receipt
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
    </div>
  );
}

function PaymentMethodSelector({
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
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 block mb-2">
            Cash Tendered
          </label>
          <Input
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
          <label className="text-[10px] font-bold text-amber-600 uppercase tracking-widest pl-1 block mb-2">
            Due Date (optional)
          </label>
          <Input
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

// --- Main Component ---

export const PaymentModal = ({
  isOpen,
  onClose,
  items,
  total,
  subtotal,
  vat,
  onSuccess,
  userRole,
}: PaymentModalProps) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const queryClient = useQueryClient();

  const handleReset = () => {
    dispatch({ type: "RESET" });
    onSuccess();
    onClose();
  };

  const handleDownloadReceipt = async () => {
    if (!state.syncedSaleId) return;
    try {
      const loadingToastId = toast.loading("Generating receipt...");
      const apiClient = (await import("@/lib/axios")).default;
      const res = await apiClient.post(
        `/sales/${state.syncedSaleId}/receipt/store`,
      );
      toast.dismiss(loadingToastId);
      if (res.data?.url) {
        window.open(res.data.url, "_blank");
      }
    } catch {
      toast.dismiss();
      toast.error("Failed to generate receipt");
    }
  };

  if (!isOpen) return null;

  const handleMethodSelect = (method: PendingPaymentMethod) => {
    dispatch({ type: "SET_METHOD", payload: method });
    if (method === "CREDIT") {
      dispatch({ type: "SET_STEP", payload: "customer" });
    }
  };

  const handleCustomerSelect = (customer: LocalCustomer) => {
    dispatch({ type: "SET_CUSTOMER", payload: customer });
    dispatch({ type: "SET_STEP", payload: "method" });
  };

  const handleConfirmPayment = async () => {
    if (state.selectedMethod === "CREDIT" && !state.selectedCustomer) {
      toast.error("Select a customer for credit sales");
      dispatch({ type: "SET_STEP", payload: "customer" });
      return;
    }

    dispatch({ type: "SET_PROCESSING", payload: true });

    const tenderedNum =
      state.selectedMethod === "CASH" ? Number(state.amountTendered) : 0;
    const change =
      state.selectedMethod === "CASH" ? Math.max(0, tenderedNum - total) : 0;

    const input: CreateSaleOfflineInput = {
      items: items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.product.sellingPrice),
        total: item.quantity * Number(item.product.sellingPrice),
      })),
      payments: [{ method: state.selectedMethod, amount: total }],
      subtotal,
      tax: vat,
      total,
      discount: 0,
      customerId: state.selectedCustomer?.id,
      creditDueDate: state.creditDueDate || undefined,
    };

    try {
      const { localReference } = await createSaleOffline(input);
      dispatch({
        type: "SET_SUCCESS",
        payload: { localRef: localReference, changeDue: change },
      });

      if (navigator.onLine) {
        const [{ flushSyncQueue }, { db }] = await Promise.all([
          import("@/lib/offline/flushSyncQueue"),
          import("@/lib/db"),
        ]);
        await flushSyncQueue();

        const synced = await db.pendingSales
          .filter((s) => s.localReference === localReference)
          .first();

        if (synced?.serverId) {
          dispatch({ type: "SET_SYNCED_ID", payload: synced.serverId });

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

      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch {
      toast.error("Sale failed", {
        description:
          "There was an error recording the transaction. Please try again.",
      });
    } finally {
      dispatch({ type: "SET_PROCESSING", payload: false });
    }
  };

  if (state.isSuccess) {
    return (
      <PaymentSuccessView
        state={state}
        onReset={handleReset}
        onDownloadReceipt={handleDownloadReceipt}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl bg-white dark:bg-slate-950 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {state.step === "customer" && (
              <button
                onClick={() =>
                  dispatch({ type: "SET_STEP", payload: "method" })
                }
                className="text-slate-400 hover:text-slate-600 mr-1"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {state.step === "customer"
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
          <div className="text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Amount Due
            </p>
            <h2 className="text-5xl font-black text-slate-900 dark:text-emerald-400 tracking-tighter">
              ₦{total.toLocaleString()}
            </h2>
          </div>

          {state.step === "customer" ? (
            <CustomerPicker
              onSelect={handleCustomerSelect}
              onCancel={() => {
                dispatch({ type: "SET_METHOD", payload: "CASH" });
                dispatch({ type: "SET_STEP", payload: "method" });
              }}
            />
          ) : (
            <PaymentMethodSelector
              state={state}
              total={total}
              userRole={userRole}
              onMethodSelect={handleMethodSelect}
              setStep={(s) => dispatch({ type: "SET_STEP", payload: s })}
              setAmountTendered={(a) =>
                dispatch({ type: "SET_AMOUNT_TENDERED", payload: a })
              }
              setCreditDueDate={(d) =>
                dispatch({ type: "SET_CREDIT_DUE_DATE", payload: d })
              }
              onClose={onClose}
            />
          )}
        </div>

        {state.step !== "customer" && (
          <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between px-8">
            <div className="flex items-center gap-2 text-[10px] font-bold text-green-400 uppercase tracking-widest">
              <Lock className="w-3.5 h-3.5" />
              {typeof window !== "undefined" && navigator.onLine
                ? "SECURE TRANSACTION"
                : "OFFLINE — WILL SYNC"}
            </div>
            <Button
              className="w-full md:w-auto min-w-[200px] h-14 rounded-xl bg-primary hover:bg-primary-hover font-black text-lg shadow-lg shadow-primary/20 transition-all"
              onClick={handleConfirmPayment}
              disabled={
                state.isProcessing ||
                (state.selectedMethod === "CREDIT" &&
                  !state.selectedCustomer) ||
                (state.selectedMethod === "CASH" &&
                  (!state.amountTendered ||
                    Number(state.amountTendered) < total))
              }
            >
              {state.isProcessing
                ? "Processing..."
                : state.selectedMethod === "CREDIT" && !state.selectedCustomer
                  ? "Select Customer First"
                  : state.selectedMethod === "CASH" &&
                      (!state.amountTendered ||
                        Number(state.amountTendered) < total)
                    ? "Insufficient Cash"
                    : "Complete Sale"}
              {!state.isProcessing && <ArrowRight className="ml-2 w-5 h-5" />}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
