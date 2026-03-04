"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
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

export default function POSScreen({ userRole }: POSScreenProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [hasActiveShift, setHasActiveShift] = useState(false);
  const [shiftOpenedAt, setShiftOpenedAt] = useState<string | null>(null);
  const [isLoadingShift, setIsLoadingShift] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isClearCartOpen, setIsClearCartOpen] = useState(false);
  const [isDrawerMovementOpen, setIsDrawerMovementOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // On mount: check shift, seed IndexedDB, flush any pending sales
  useEffect(() => {
    const checkShift = async () => {
      // OWNER and MANAGER can always use the POS — no shift required
      if (userRole === "OWNER" || userRole === "MANAGER") {
        setHasActiveShift(true);
        setIsLoadingShift(false);
        return;
      }
      try {
        const response = await apiClient.get("/shifts/current");
        const shift = response.data;
        setHasActiveShift(!!shift);
        if (shift?.openedAt) {
          setShiftOpenedAt(shift.openedAt);
        }
      } catch {
        setHasActiveShift(false);
      } finally {
        setIsLoadingShift(false);
      }
    };

    const init = async () => {
      await checkShift();
      // Seed product cache for offline use (skips if seeded within 15 min)
      seedOfflineData().catch(console.error);
      // Flush any pending sales from a previous offline session
      if (navigator.onLine) {
        flushSyncQueue().catch(console.error);
      }
    };

    init();
  }, [userRole]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1 → focus search bar
      if (e.key === "F1") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // Escape → clear cart (with confirmation if items exist) or close modals
      if (e.key === "Escape") {
        if (isPaymentModalOpen) return; // let the modal handle it
        if (isHistoryOpen) {
          setIsHistoryOpen(false);
          return;
        }
        if (cartItems.length > 0) {
          setIsClearCartOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cartItems.length, isPaymentModalOpen, isHistoryOpen]);

  const handleSelectProduct = useCallback((product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast("Added to cart");
  }, []);

  const handleUpdateQuantity = useCallback(
    (productId: string, delta: number) => {
      setCartItems((prev) =>
        prev
          .map((item) => {
            if (item.product.id === productId) {
              const newQuantity = item.quantity + delta;
              return newQuantity > 0
                ? { ...item, quantity: newQuantity }
                : null;
            }
            return item;
          })
          .filter((item): item is CartItem => item !== null),
      );
    },
    [],
  );

  const handleClearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const handlePaymentSuccess = useCallback(() => {
    setCartItems([]);
    toast.success("Transaction recorded");
  }, []);

  const totals = useMemo(() => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + Number(item.product.sellingPrice) * item.quantity,
      0,
    );
    const vatRate = 0.075;
    const vat = subtotal * vatRate;
    const total = subtotal + vat;
    return { subtotal, vat, total };
  }, [cartItems]);

  return (
    <div
      className="flex flex-col overflow-hidden bg-white"
      style={{ height: "calc(100dvh - 64px)" }}
    >
      {/* Shift duration warning — only for cashiers with a stored openedAt */}
      {shiftOpenedAt && <ShiftDurationWarning shiftOpenedAt={shiftOpenedAt} />}

      <div className="flex flex-1 min-h-0 min-w-0">
        <ProductBrowser onSelectProduct={handleSelectProduct} />

        <CartPanel
          items={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onClearCart={handleClearCart}
          onCheckout={() => setIsPaymentModalOpen(true)}
          onOpenDrawer={() => setIsDrawerMovementOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
        />
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        items={cartItems}
        subtotal={totals.subtotal}
        vat={totals.vat}
        total={totals.total}
        onSuccess={handlePaymentSuccess}
        userRole={userRole}
      />

      {/* Offline sale queue indicator */}
      <SyncStatusBar />

      {/* Cash Drawer Movement Modal */}
      <DrawerMovementModal
        isOpen={isDrawerMovementOpen}
        onClose={() => setIsDrawerMovementOpen(false)}
        onSuccess={() => {}}
      />

      {/* Sales history modal */}
      <SalesHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      {/* Clear Cart Confirmation */}
      <AlertDialog open={isClearCartOpen} onOpenChange={setIsClearCartOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear cart?</AlertDialogTitle>
            <AlertDialogDescription>
              All {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}{" "}
              will be removed from the cart.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsClearCartOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                setCartItems([]);
                setIsClearCartOpen(false);
                toast("Cart cleared");
              }}
            >
              Clear Cart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Register Lock */}
      {!isLoadingShift && (
        <OpenRegisterModal
          isOpen={!hasActiveShift}
          onSuccess={() => setHasActiveShift(true)}
        />
      )}
    </div>
  );
}
