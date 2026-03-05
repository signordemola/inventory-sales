"use client";

import { useReducer, useEffect } from "react";
import { X, Lock, ArrowRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CartItem } from "./cart-panel";
import { CustomerPicker } from "./customer-picker";
import { toast } from "sonner";
import { createSaleOffline, CreateSaleOfflineInput } from "@/lib/offline/sales";
import { PendingPaymentMethod, LocalCustomer } from "@/lib/db";
import { useQueryClient } from "@tanstack/react-query";
import { PaymentModalState, Step } from "./payment-types";
import { PaymentSuccessView } from "./payment-success-view";
import { PaymentMethodSelector } from "./payment-method-selector";
import { Customer } from "@/hooks/use-customers";

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
  | { type: "SET_REFERENCE"; payload: string }
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
  reference: "",
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
    case "SET_REFERENCE":
      return { ...state, reference: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

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
  const [state, dispatch] = useReducer(reducer, initialState);
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
      payments: [
        {
          method: state.selectedMethod,
          amount: total,
          reference: state.reference || undefined,
        },
      ],
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
      dispatch({
        type: "SET_SUCCESS",
        payload: { localRef: localReference, changeDue: change },
      });

      // Try to sync immediately, but silently swallow errors —
      // the SyncStatusBar + flushSyncQueue will retry later.
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
                .catch(() => {}); // Silent — receipt can be generated later
            });
          }
        }
      } catch {
        // Sync will be retried automatically when back online
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
              setReference={(r) =>
                dispatch({ type: "SET_REFERENCE", payload: r })
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
