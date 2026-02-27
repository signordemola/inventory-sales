"use client";

import React, { useState, useCallback, useMemo } from "react";
import { ProductBrowser } from "@/components/pos/product-browser";
import { CartPanel, CartItem } from "@/components/pos/cart-panel";
import { PaymentModal } from "@/components/pos/payment-modal";
import { Product } from "@/types/products";
import { UserRoleType } from "@/types";
import { toast } from "sonner";

interface POSScreenProps {
  userRole: UserRoleType;
}

export default function POSScreen({ userRole }: POSScreenProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handleSelectProduct = useCallback((product: Product) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id);
      if (existingItem) {
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
      setCartItems((prev) => {
        return prev
          .map((item) => {
            if (item.product.id === productId) {
              const newQuantity = item.quantity + delta;
              return newQuantity > 0
                ? { ...item, quantity: newQuantity }
                : null;
            }
            return item;
          })
          .filter((item): item is CartItem => item !== null);
      });
    },
    [],
  );

  const handleClearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const handleCheckout = useCallback(() => {
    setIsPaymentModalOpen(true);
  }, []);

  const handlePaymentSuccess = useCallback(() => {
    setCartItems([]);
    toast("Transaction completed successfully");
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
        <ProductBrowser onSelectProduct={handleSelectProduct} />

        <CartPanel
          items={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onClearCart={handleClearCart}
          onCheckout={handleCheckout}
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
    </div>
  );
}
