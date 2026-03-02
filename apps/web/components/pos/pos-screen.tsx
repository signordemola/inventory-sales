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
import { SalesHistoryDrawer } from "@/components/pos/sales-history-drawer";
import apiClient from "@/lib/axios";
import { Product } from "@/types/products";
import { UserRoleType } from "@/types";
import { toast } from "sonner";
import { seedOfflineData } from "@/lib/offline/seed";
import { flushSyncQueue } from "@/lib/offline/flushSyncQueue";
import { History } from "lucide-react";

interface POSScreenProps {
  userRole: UserRoleType;
}

export default function POSScreen({ userRole }: POSScreenProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [hasActiveShift, setHasActiveShift] = useState(false);
  const [isLoadingShift, setIsLoadingShift] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // On mount: check shift, seed IndexedDB, flush any pending sales
  useEffect(() => {
    const checkShift = async () => {
      try {
        const response = await apiClient.get("/shifts/current");
        setHasActiveShift(!!response.data);
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
  }, []);

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
          if (window.confirm("Clear all items from the cart?")) {
            setCartItems([]);
            toast("Cart cleared");
          }
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
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <div className="flex flex-1 min-h-0">
        <ProductBrowser
          onSelectProduct={handleSelectProduct}
          searchInputRef={searchInputRef}
        />

        <CartPanel
          items={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onClearCart={handleClearCart}
          onCheckout={() => setIsPaymentModalOpen(true)}
        />
      </div>

      {/* History toggle button */}
      <button
        onClick={() => setIsHistoryOpen(true)}
        className="fixed right-4 bottom-20 z-30 flex items-center gap-2 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg hover:bg-slate-700 transition-all"
        title="View today's sales history"
      >
        <History className="w-4 h-4" />
        History
      </button>

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

      {/* Sales history drawer */}
      <SalesHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      {/* Backdrop for drawer */}
      {isHistoryOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20"
          onClick={() => setIsHistoryOpen(false)}
        />
      )}

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
