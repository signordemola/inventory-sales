"use client";

import { useReducer, useEffect, useCallback } from "react";
import {
  X,
  Lock,
  ArrowRight,
  ChevronLeft,
  Plus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
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
import {
  PaymentModalState,
  ReceiptData,
  SplitPaymentRow,
  Step,
} from "./payment-types";
import { PaymentSuccessView } from "./payment-success-view";
import { Customer } from "@/hooks/use-customers";
import { createId } from "@paralleldrive/cuid2";

// ─── Props ────────────────────────────────────────────────────────────────────

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  discount: number;
  discountType: "PERCENTAGE" | "FLAT";
  vat: number;
  total: number;
  onSuccess: () => void;
  userRole?: string;
  preSelectedCustomer?: Customer | null;
}

// ─── Payment method metadata ──────────────────────────────────────────────────

const METHODS: {
  value: PendingPaymentMethod;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}[] = [
  {
    value: "CASH",
    label: "Cash",
    icon: Banknote,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    value: "CARD",
    label: "POS/Card",
    icon: CreditCard,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    value: "TRANSFER",
    label: "Transfer",
    icon: Building2,
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    value: "PAYSTACK",
    label: "Paystack",
    icon: Smartphone,
    color: "text-pink-600",
    bg: "bg-pink-50",
  },
  {
    value: "CREDIT",
    label: "Credit",
    icon: CreditCard,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
];

function makeCashierRow(): SplitPaymentRow {
  return { id: createId(), method: "CASH", amount: "", reference: "" };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "ADD_ROW" }
  | { type: "REMOVE_ROW"; id: string }
  | { type: "UPDATE_ROW"; id: string; patch: Partial<SplitPaymentRow> }
  | { type: "SET_STEP"; payload: Step }
  | { type: "SET_CUSTOMER"; payload: LocalCustomer | null }
  | { type: "SET_CREDIT_DUE_DATE"; payload: string }
  | { type: "SET_PROCESSING"; payload: boolean }
  | {
      type: "SET_SUCCESS";
      payload: {
        localRef: string;
        changeDue: number;
        receiptData?: ReceiptData;
      };
    }
  | { type: "SET_SYNCED_ID"; payload: string }
  | { type: "RESET" };

const initialState: PaymentModalState = {
  payments: [makeCashierRow()],
  step: "payment",
  selectedCustomer: null,
  creditDueDate: "",
  isProcessing: false,
  isSuccess: false,
  localRef: null,
  syncedSaleId: null,
  changeDue: 0,
};

function reducer(state: PaymentModalState, action: Action): PaymentModalState {
  switch (action.type) {
    case "ADD_ROW":
      return { ...state, payments: [...state.payments, makeCashierRow()] };
    case "REMOVE_ROW":
      return {
        ...state,
        payments: state.payments.filter((r) => r.id !== action.id),
      };
    case "UPDATE_ROW":
      return {
        ...state,
        payments: state.payments.map((r) =>
          r.id === action.id ? { ...r, ...action.patch } : r,
        ),
      };
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
        receiptData: action.payload.receiptData,
      };
    case "SET_SYNCED_ID":
      return { ...state, syncedSaleId: action.payload };
    case "RESET":
      return { ...initialState, payments: [makeCashierRow()] };
    default:
      return state;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export const PaymentModal = ({
  isOpen,
  onClose,
  items,
  total,
  subtotal,
  discount,
  discountType,
  vat,
  onSuccess,
  userRole,
  preSelectedCustomer,
}: PaymentModalProps) => {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    payments: [makeCashierRow()],
  });
  const queryClient = useQueryClient();

  // Sync pre-selected customer when modal opens
  useEffect(() => {
    if (isOpen) {
      if (preSelectedCustomer) {
        dispatch({
          type: "SET_CUSTOMER",
          payload: {
            id: preSelectedCustomer.id,
            name: preSelectedCustomer.name,
            phone: preSelectedCustomer.phone || undefined,
            email: preSelectedCustomer.email || undefined,
            businessId: preSelectedCustomer.businessId,
            creditBalance: 0,
            lastSyncedAt: Date.now(),
          },
        });
      } else {
        dispatch({ type: "SET_CUSTOMER", payload: null });
      }
    }
  }, [isOpen, preSelectedCustomer]);

  // Derived amounts
  const totalPaid = state.payments.reduce(
    (sum, r) => sum + (parseFloat(r.amount) || 0),
    0,
  );
  const remaining = Math.max(0, total - totalPaid);
  const overpaid = Math.max(0, totalPaid - total); // change due for cash
  const isPaid = totalPaid >= total;

  // Shortcut: set exact remaining on a row
  const setExact = useCallback(
    (id: string) => {
      const row = state.payments.find((r) => r.id === id);
      if (!row) return;
      const rowPaid = state.payments
        .filter((r) => r.id !== id)
        .reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
      const exact = Math.max(0, total - rowPaid);
      dispatch({ type: "UPDATE_ROW", id, patch: { amount: String(exact) } });
    },
    [state.payments, total],
  );

  const hasCreditRow = state.payments.some((r) => r.method === "CREDIT");
  const creditNeedsCustomer = hasCreditRow && !state.selectedCustomer;

  const canComplete = isPaid && !creditNeedsCustomer && !state.isProcessing;

  const handleReset = () => {
    dispatch({ type: "RESET" });
    onSuccess();
    onClose();
  };

  const handleConfirmPayment = async () => {
    if (creditNeedsCustomer) {
      toast.error("Select a customer for credit sales");
      dispatch({ type: "SET_STEP", payload: "customer" });
      return;
    }
    if (!isPaid) {
      toast.error(`Still ₦${remaining.toLocaleString()} remaining`);
      return;
    }

    dispatch({ type: "SET_PROCESSING", payload: true });

    const cashRows = state.payments.filter((r) => r.method === "CASH");
    const changeDue = cashRows.length > 0 && totalPaid > total ? overpaid : 0;

    const input: CreateSaleOfflineInput = {
      items: items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.product.sellingPrice),
        total: item.quantity * Number(item.product.sellingPrice),
      })),
      payments: state.payments.map((r) => ({
        method: r.method,
        amount: parseFloat(r.amount) || 0,
        reference: r.reference || undefined,
      })),
      subtotal,
      tax: vat,
      total,
      discount,
      discountType,
      customerId: state.selectedCustomer?.id,
      creditDueDate: state.creditDueDate || undefined,
    };

    try {
      const { localReference } = await createSaleOffline(input);

      // Synthesize receipt data to pass to the success screen
      const receiptData = {
        id: localReference,
        reference: localReference,
        createdAt: new Date().toISOString(),
        cashier: { name: "Cashier" }, // ideally from session, but "System" will fallback
        customer: state.selectedCustomer || undefined,
        items: input.items,
        subtotal: input.subtotal,
        tax: input.tax,
        discount: input.discount || 0,
        total: input.total,
        amountPaid: state.payments
          .filter((p) => p.method !== "CREDIT")
          .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0),
        change: changeDue,
        status: (creditNeedsCustomer
          ? "CREDIT"
          : "COMPLETED") as ReceiptData["status"],
        payments: input.payments,
      };

      dispatch({
        type: "SET_SUCCESS",
        payload: { localRef: localReference, changeDue, receiptData },
      });

      try {
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
                .catch(() => {});
            });
          }
        }
      } catch {
        // Sync will be retried automatically
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

  if (!isOpen) return null;

  if (state.isSuccess) {
    return <PaymentSuccessView state={state} onReset={handleReset} />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl bg-white dark:bg-slate-950 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {state.step === "customer" && (
              <button
                onClick={() =>
                  dispatch({ type: "SET_STEP", payload: "payment" })
                }
                className="text-slate-400 hover:text-slate-600 mr-1"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {state.step === "customer" ? "Select Customer" : "Payment"}
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

        {state.step === "customer" ? (
          /* ── Customer picker step ── */
          <div className="p-8">
            <CustomerPicker
              onSelect={(customer: LocalCustomer) => {
                dispatch({ type: "SET_CUSTOMER", payload: customer });
                dispatch({ type: "SET_STEP", payload: "payment" });
              }}
              onCancel={() =>
                dispatch({ type: "SET_STEP", payload: "payment" })
              }
            />
          </div>
        ) : (
          <>
            {/* ── Amount summary ── */}
            <div className="px-8 pt-6 pb-4 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Amount Due
              </p>
              <h2 className="text-5xl font-black text-slate-900 dark:text-emerald-400 tracking-tighter mt-1">
                ₦
                {total.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h2>

              {/* Live progress bar */}
              <div className="mt-4 mx-auto max-w-xs">
                <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5">
                  <span>Paid: ₦{totalPaid.toLocaleString()}</span>
                  {remaining > 0 ? (
                    <span className="text-orange-500">
                      Remaining: ₦{remaining.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-emerald-500">
                      Change: ₦{overpaid.toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isPaid ? "bg-emerald-500" : "bg-primary"}`}
                    style={{
                      width: `${Math.min(100, (totalPaid / total) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ── Payment rows ── */}
            <div className="px-8 pb-4 space-y-3 max-h-[340px] overflow-y-auto">
              {state.payments.map((row) => {
                const meta = METHODS.find((m) => m.value === row.method)!;
                const Icon = meta.icon;
                const isCredit = row.method === "CREDIT";
                const needsRef =
                  row.method === "CARD" ||
                  row.method === "TRANSFER" ||
                  row.method === "PAYSTACK";

                return (
                  <div
                    key={row.id}
                    className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800"
                  >
                    {/* Row label + method selector + delete */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}
                      >
                        <Icon className={`w-4 h-4 ${meta.color}`} />
                      </div>
                      <select
                        value={row.method}
                        onChange={(e) => {
                          const next = e.target.value as PendingPaymentMethod;
                          dispatch({
                            type: "UPDATE_ROW",
                            id: row.id,
                            patch: { method: next, reference: "" },
                          });
                          if (next === "CREDIT" && !state.selectedCustomer) {
                            dispatch({ type: "SET_STEP", payload: "customer" });
                          }
                        }}
                        className="flex-1 h-9 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                        disabled={
                          !!userRole && userRole === "CASHIER" && isCredit
                        }
                      >
                        {METHODS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                      {state.payments.length > 1 && (
                        <button
                          onClick={() =>
                            dispatch({ type: "REMOVE_ROW", id: row.id })
                          }
                          className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Amount input */}
                    {!isCredit && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-400">
                          ₦
                        </span>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          placeholder="0.00"
                          value={row.amount}
                          onChange={(e) =>
                            dispatch({
                              type: "UPDATE_ROW",
                              id: row.id,
                              patch: { amount: e.target.value },
                            })
                          }
                          className="flex-1 h-10 rounded-lg font-mono text-sm font-bold"
                        />
                        <button
                          onClick={() => setExact(row.id)}
                          className="text-xs font-bold px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
                        >
                          Exact
                        </button>
                        {/* Quick cash buttons for cash rows */}
                        {row.method === "CASH" && (
                          <div className="flex gap-1">
                            {[500, 1000, 2000, 5000].map((amt) => (
                              <button
                                key={amt}
                                onClick={() =>
                                  dispatch({
                                    type: "UPDATE_ROW",
                                    id: row.id,
                                    patch: { amount: String(amt) },
                                  })
                                }
                                className="text-[10px] font-bold px-2 py-1.5 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors"
                              >
                                {amt >= 1000 ? `${amt / 1000}k` : amt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Credit: show customer & due date */}
                    {isCredit && (
                      <div className="space-y-2">
                        <button
                          onClick={() =>
                            dispatch({ type: "SET_STEP", payload: "customer" })
                          }
                          className="w-full flex items-center gap-2 h-10 px-3 rounded-lg bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-white hover:bg-slate-50 transition-colors"
                        >
                          {state.selectedCustomer
                            ? state.selectedCustomer.name
                            : "Select customer →"}
                        </button>
                        <Input
                          type="date"
                          value={state.creditDueDate}
                          onChange={(e) =>
                            dispatch({
                              type: "SET_CREDIT_DUE_DATE",
                              payload: e.target.value,
                            })
                          }
                          className="h-10 rounded-lg text-sm font-medium"
                          placeholder="Due date (optional)"
                        />
                      </div>
                    )}

                    {/* Reference input for card/transfer/paystack */}
                    {needsRef && (
                      <Input
                        placeholder={`${meta.label} reference / transaction ID`}
                        value={row.reference}
                        onChange={(e) =>
                          dispatch({
                            type: "UPDATE_ROW",
                            id: row.id,
                            patch: { reference: e.target.value },
                          })
                        }
                        className="h-10 rounded-lg text-sm"
                      />
                    )}
                  </div>
                );
              })}

              {/* Add row button */}
              {remaining > 0 && (
                <button
                  onClick={() => dispatch({ type: "ADD_ROW" })}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl border-2 border-dashed border-slate-200 text-sm font-bold text-slate-400 hover:border-primary hover:text-primary transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Split payment — add another method
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between px-8">
              <div className="flex items-center gap-2 text-[10px] font-bold text-green-400 uppercase tracking-widest">
                <Lock className="w-3.5 h-3.5" />
                {typeof window !== "undefined" && navigator.onLine
                  ? "SECURE TRANSACTION"
                  : "OFFLINE — WILL SYNC"}
              </div>
              <Button
                className="w-full md:w-auto min-w-[200px] h-14 rounded-xl bg-primary hover:bg-primary/90 font-black text-lg shadow-lg shadow-primary/20 transition-all text-background"
                onClick={handleConfirmPayment}
                disabled={!canComplete}
              >
                {state.isProcessing
                  ? "Processing..."
                  : creditNeedsCustomer
                    ? "Select Customer First"
                    : !isPaid
                      ? `₦${remaining.toLocaleString()} remaining`
                      : "Complete Sale"}
                {!state.isProcessing && <ArrowRight className="ml-2 w-5 h-5" />}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
