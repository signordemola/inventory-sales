"use client";

import { useReducer, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Loader2, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import apiClient from "@/lib/axios";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface DrawerMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type MovementType = "PAID_IN" | "PAID_OUT";

type MovementState = {
  type: MovementType;
  amount: string;
  reason: string;
  isSubmitting: boolean;
  error: string;
};

type MovementAction =
  | { type: "SET_TYPE"; payload: MovementType }
  | { type: "SET_AMOUNT"; payload: string }
  | { type: "SET_REASON"; payload: string }
  | { type: "SET_SUBMITTING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string }
  | { type: "RESET" };

const initialState: MovementState = {
  type: "PAID_IN",
  amount: "",
  reason: "",
  isSubmitting: false,
  error: "",
};

function movementReducer(
  state: MovementState,
  action: MovementAction,
): MovementState {
  switch (action.type) {
    case "SET_TYPE":
      return { ...state, type: action.payload };
    case "SET_AMOUNT":
      return { ...state, amount: action.payload };
    case "SET_REASON":
      return { ...state, reason: action.payload };
    case "SET_SUBMITTING":
      return { ...state, isSubmitting: action.payload, error: "" };
    case "SET_ERROR":
      return { ...state, error: action.payload, isSubmitting: false };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

export function DrawerMovementModal({
  isOpen,
  onClose,
  onSuccess,
}: DrawerMovementModalProps) {
  const [state, dispatch] = useReducer(movementReducer, initialState);

  const parsedAmount = useMemo(() => Number(state.amount), [state.amount]);
  const isValid = useMemo(
    () => parsedAmount > 0 && state.reason.trim().length > 0,
    [parsedAmount, state.reason],
  );

  const handleSubmit = async () => {
    if (!isValid) return;
    dispatch({ type: "SET_SUBMITTING", payload: true });

    try {
      await apiClient.post("/shifts/drawer-movement", {
        type: state.type,
        amount: parsedAmount,
        reason: state.reason.trim(),
      });

      toast.success(
        state.type === "PAID_IN"
          ? `${formatCurrency(parsedAmount)} added to drawer`
          : `${formatCurrency(parsedAmount)} removed from drawer`,
      );

      dispatch({ type: "RESET" });
      onSuccess();
      onClose();
    } catch {
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to record movement. Please try again.",
      });
    }
  };

  const handleClose = () => {
    dispatch({ type: "RESET" });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Cash Drawer Movement
          </DialogTitle>
          <DialogDescription className="text-center">
            Record cash added to or removed from the register.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => dispatch({ type: "SET_TYPE", payload: "PAID_IN" })}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                state.type === "PAID_IN"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 text-slate-400 hover:border-slate-300"
              }`}
            >
              <ArrowDownToLine className="w-6 h-6" />
              <span className="font-bold text-sm">Cash In</span>
              <span className="text-[10px] leading-tight">
                Add money to drawer
              </span>
            </button>
            <button
              type="button"
              onClick={() =>
                dispatch({ type: "SET_TYPE", payload: "PAID_OUT" })
              }
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                state.type === "PAID_OUT"
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-slate-200 text-slate-400 hover:border-slate-300"
              }`}
            >
              <ArrowUpFromLine className="w-6 h-6" />
              <span className="font-bold text-sm">Cash Out</span>
              <span className="text-[10px] leading-tight">
                Remove from drawer
              </span>
            </button>
          </div>

          <FieldGroup>
            <Field>
              <FieldLabel>Amount (₦)</FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={state.amount}
                  onChange={(e) =>
                    dispatch({ type: "SET_AMOUNT", payload: e.target.value })
                  }
                  min="0"
                  step="0.01"
                  className="h-12 text-lg font-bold"
                />
              </FieldContent>
              {state.amount && parsedAmount <= 0 && (
                <FieldError>Amount must be greater than zero</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel>Reason</FieldLabel>
              <FieldContent>
                <Input
                  placeholder={
                    state.type === "PAID_IN"
                      ? "e.g. Change top-up, float adjustment"
                      : "e.g. Petty cash, vendor payment"
                  }
                  value={state.reason}
                  onChange={(e) =>
                    dispatch({ type: "SET_REASON", payload: e.target.value })
                  }
                  className="h-10"
                />
              </FieldContent>
              {state.reason.length === 0 && state.amount && (
                <FieldError>Reason is required</FieldError>
              )}
            </Field>
          </FieldGroup>

          {state.error && (
            <p className="text-sm text-red-500 font-medium text-center">
              {state.error}
            </p>
          )}

          {isValid && (
            <div
              className={`rounded-xl p-4 text-center ${
                state.type === "PAID_IN"
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                {state.type === "PAID_IN"
                  ? "Adding to Drawer"
                  : "Removing from Drawer"}
              </p>
              <p
                className={`text-2xl font-black ${
                  state.type === "PAID_IN" ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {state.type === "PAID_IN" ? "+" : "−"}
                {formatCurrency(parsedAmount)}
              </p>
              <p className="text-xs text-slate-500 mt-1">{state.reason}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-11 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || state.isSubmitting}
              className={`flex-1 h-11 rounded-xl font-bold ${
                state.type === "PAID_IN"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
              } text-white`}
            >
              {state.isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                `Confirm ${state.type === "PAID_IN" ? "Cash In" : "Cash Out"}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
