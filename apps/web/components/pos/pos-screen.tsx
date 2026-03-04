"use client";

import React, {
  useCallback,
  useMemo,
  useEffect,
  useRef,
  useReducer,
} from "react";
import { ProductBrowser } from "@/components/pos/product-browser";
import { CartPanel, CartItem } from "@/components/pos/cart-panel";
import { PaymentModal } from "@/components/pos/payment-modal";
import { OpenRegisterModal } from "@/components/pos/open-register-modal";
import { SyncStatusBar } from "@/components/pos/sync-status-bar";
import { SalesHistoryModal } from "@/components/pos/sales-history-modal";
import { ShiftDurationWarning } from "@/components/pos/shift-duration-warning";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import apiClient from "@/lib/axios";
import { Product } from "@/types/products";
import { UserRoleType } from "@/types";
import { toast } from "sonner";
import { seedOfflineData } from "@/lib/offline/seed";
import { flushSyncQueue } from "@/lib/offline/flushSyncQueue";
import { DrawerMovementModal } from "@/components/shifts/drawer-movement-modal";

interface POSScreenProps {
  userRole: UserRoleType;
}

// --- State Definition ---
type POSState = {
  cartItems: CartItem[];
  isPaymentModalOpen: boolean;
  hasActiveShift: boolean;
  shiftOpenedAt: string | null;
  isLoadingShift: boolean;
  isHistoryOpen: boolean;
  isClearCartOpen: boolean;
  isDrawerMovementOpen: boolean;
};

type POSAction =
  | { type: "SET_CART_ITEMS"; payload: CartItem[] }
  | { type: "ADD_TO_CART"; payload: Product }
  | { type: "UPDATE_QUANTITY"; payload: { productId: string; delta: number } }
  | {
      type: "SET_MODAL_OPEN";
      payload: {
        modal: "payment" | "history" | "clearCart" | "drawerMovement";
        isOpen: boolean;
      };
    }
  | {
      type: "SET_SHIFT_STATUS";
      payload: {
        hasActiveShift: boolean;
        openedAt: string | null;
        isLoading: boolean;
      };
    };

const initialPOSState: POSState = {
  cartItems: [],
  isPaymentModalOpen: false,
  hasActiveShift: false,
  shiftOpenedAt: null,
  isLoadingShift: true,
  isHistoryOpen: false,
  isClearCartOpen: false,
  isDrawerMovementOpen: false,
};

function posReducer(state: POSState, action: POSAction): POSState {
  switch (action.type) {
    case "SET_CART_ITEMS":
      return { ...state, cartItems: action.payload };
    case "ADD_TO_CART": {
      const existing = state.cartItems.find(
        (item) => item.product.id === action.payload.id,
      );
      if (existing) {
        return {
          ...state,
          cartItems: state.cartItems.map((item) =>
            item.product.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        };
      }
      return {
        ...state,
        cartItems: [
          ...state.cartItems,
          { product: action.payload, quantity: 1 },
        ],
      };
    }
    case "UPDATE_QUANTITY": {
      return {
        ...state,
        cartItems: state.cartItems
          .map((item) => {
            if (item.product.id === action.payload.productId) {
              const newQuantity = item.quantity + action.payload.delta;
              return newQuantity > 0
                ? { ...item, quantity: newQuantity }
                : null;
            }
            return item;
          })
          .filter((item): item is CartItem => item !== null),
      };
    }
    case "SET_MODAL_OPEN":
      return {
        ...state,
        ...(action.payload.modal === "payment" && {
          isPaymentModalOpen: action.payload.isOpen,
        }),
        ...(action.payload.modal === "history" && {
          isHistoryOpen: action.payload.isOpen,
        }),
        ...(action.payload.modal === "clearCart" && {
          isClearCartOpen: action.payload.isOpen,
        }),
        ...(action.payload.modal === "drawerMovement" && {
          isDrawerMovementOpen: action.payload.isOpen,
        }),
      };
    case "SET_SHIFT_STATUS":
      return {
        ...state,
        hasActiveShift: action.payload.hasActiveShift,
        shiftOpenedAt: action.payload.openedAt,
        isLoadingShift: action.payload.isLoading,
      };
    default:
      return state;
  }
}

export default function POSScreen({ userRole }: POSScreenProps) {
  const [state, dispatch] = useReducer(posReducer, initialPOSState);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const init = async () => {
      if (userRole === "OWNER" || userRole === "MANAGER") {
        dispatch({
          type: "SET_SHIFT_STATUS",
          payload: { hasActiveShift: true, openedAt: null, isLoading: false },
        });
      } else {
        try {
          const response = await apiClient.get("/shifts/current");
          const shift = response.data;
          dispatch({
            type: "SET_SHIFT_STATUS",
            payload: {
              hasActiveShift: !!shift,
              openedAt: shift?.openedAt || null,
              isLoading: false,
            },
          });
        } catch {
          dispatch({
            type: "SET_SHIFT_STATUS",
            payload: {
              hasActiveShift: false,
              openedAt: null,
              isLoading: false,
            },
          });
        }
      }

      seedOfflineData().catch(console.error);
      if (navigator.onLine) {
        flushSyncQueue().catch(console.error);
      }
    };

    init();
  }, [userRole]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        if (state.isPaymentModalOpen) return;
        if (state.isHistoryOpen) {
          dispatch({
            type: "SET_MODAL_OPEN",
            payload: { modal: "history", isOpen: false },
          });
          return;
        }
        if (state.cartItems.length > 0) {
          dispatch({
            type: "SET_MODAL_OPEN",
            payload: { modal: "clearCart", isOpen: true },
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.cartItems.length, state.isPaymentModalOpen, state.isHistoryOpen]);

  const handleSelectProduct = useCallback((product: Product) => {
    dispatch({ type: "ADD_TO_CART", payload: product });
    toast("Added to cart");
  }, []);

  const handleUpdateQuantity = useCallback(
    (productId: string, delta: number) => {
      dispatch({ type: "UPDATE_QUANTITY", payload: { productId, delta } });
    },
    [],
  );

  const handlePaymentSuccess = useCallback(() => {
    dispatch({ type: "SET_CART_ITEMS", payload: [] });
    toast.success("Transaction recorded");
  }, []);

  const totals = useMemo(() => {
    const subtotal = state.cartItems.reduce(
      (sum, item) => sum + Number(item.product.sellingPrice) * item.quantity,
      0,
    );
    const vatRate = 0.075;
    const vat = subtotal * vatRate;
    const total = subtotal + vat;
    return { subtotal, vat, total };
  }, [state.cartItems]);

  return (
    <div
      className="flex flex-col overflow-hidden bg-white"
      style={{ height: "calc(100dvh - 64px)" }}
    >
      {state.shiftOpenedAt && (
        <ShiftDurationWarning shiftOpenedAt={state.shiftOpenedAt} />
      )}

      <div className="flex flex-1 min-h-0 min-w-0">
        <ProductBrowser onSelectProduct={handleSelectProduct} />

        <CartPanel
          items={state.cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onClearCart={() => dispatch({ type: "SET_CART_ITEMS", payload: [] })}
          onCheckout={() =>
            dispatch({
              type: "SET_MODAL_OPEN",
              payload: { modal: "payment", isOpen: true },
            })
          }
          onOpenDrawer={() =>
            dispatch({
              type: "SET_MODAL_OPEN",
              payload: { modal: "drawerMovement", isOpen: true },
            })
          }
          onOpenHistory={() =>
            dispatch({
              type: "SET_MODAL_OPEN",
              payload: { modal: "history", isOpen: true },
            })
          }
        />
      </div>

      <PaymentModal
        isOpen={state.isPaymentModalOpen}
        onClose={() =>
          dispatch({
            type: "SET_MODAL_OPEN",
            payload: { modal: "payment", isOpen: false },
          })
        }
        items={state.cartItems}
        subtotal={totals.subtotal}
        vat={totals.vat}
        total={totals.total}
        onSuccess={handlePaymentSuccess}
        userRole={userRole}
      />

      <SyncStatusBar />

      <DrawerMovementModal
        isOpen={state.isDrawerMovementOpen}
        onClose={() =>
          dispatch({
            type: "SET_MODAL_OPEN",
            payload: { modal: "drawerMovement", isOpen: false },
          })
        }
        onSuccess={() => {}}
      />

      <SalesHistoryModal
        isOpen={state.isHistoryOpen}
        onClose={() =>
          dispatch({
            type: "SET_MODAL_OPEN",
            payload: { modal: "history", isOpen: false },
          })
        }
      />

      <AlertDialog
        open={state.isClearCartOpen}
        onOpenChange={(isOpen) =>
          dispatch({
            type: "SET_MODAL_OPEN",
            payload: { modal: "clearCart", isOpen },
          })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear cart?</AlertDialogTitle>
            <AlertDialogDescription>
              All {state.cartItems.length} item
              {state.cartItems.length !== 1 ? "s" : ""} will be removed from the
              cart.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() =>
                dispatch({
                  type: "SET_MODAL_OPEN",
                  payload: { modal: "clearCart", isOpen: false },
                })
              }
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                dispatch({ type: "SET_CART_ITEMS", payload: [] });
                dispatch({
                  type: "SET_MODAL_OPEN",
                  payload: { modal: "clearCart", isOpen: false },
                });
                toast("Cart cleared");
              }}
            >
              Clear Cart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {!state.isLoadingShift && (
        <OpenRegisterModal
          isOpen={!state.hasActiveShift}
          onSuccess={() =>
            dispatch({
              type: "SET_SHIFT_STATUS",
              payload: {
                hasActiveShift: true,
                openedAt: state.shiftOpenedAt,
                isLoading: false,
              },
            })
          }
        />
      )}
    </div>
  );
}
