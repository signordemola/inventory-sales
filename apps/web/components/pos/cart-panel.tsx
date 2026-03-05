"use client";

import React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import {
  Trash2,
  ArrowRight,
  Minus,
  Plus,
  ShoppingCart,
  ImageOff,
  History,
  Wallet,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Product } from "@/types/products";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CustomerSelector } from "@/components/pos/customer-selector";
import { Customer } from "@/hooks/use-customers";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartPanelProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onClearCart: () => void;
  discount: number;
  discountType: "PERCENTAGE" | "FLAT";
  onUpdateDiscount: (amount: number, type: "PERCENTAGE" | "FLAT") => void;
  onCheckout: () => void;
  onOpenDrawer: () => void;
  onOpenHistory: () => void;
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
}

// Generate a stable order reference based on current date
function getOrderRef() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const ref = `#ORD-${now.getFullYear().toString().slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  const time = now.toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return { ref, time };
}

export const CartPanel = ({
  items,
  onUpdateQuantity,
  onClearCart,
  discount,
  discountType,
  onUpdateDiscount,
  onCheckout,
  onOpenDrawer,
  onOpenHistory,
  selectedCustomer,
  onSelectCustomer,
}: CartPanelProps) => {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.product.sellingPrice) * item.quantity,
    0,
  );

  let discountAmount = 0;
  if (discountType === "PERCENTAGE") {
    discountAmount = subtotal * (discount / 100);
  } else {
    discountAmount = discount;
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  const settings =
    useLiveQuery(() => db.businessSettings.get("settings"), []) ?? null;
  const taxRatePercent = settings?.taxRate ?? 0;
  const vatRate = taxRatePercent / 100;
  const vat = taxableAmount * vatRate;
  const total = taxableAmount + vat;

  const { ref, time } = getOrderRef();

  return (
    <div className="w-full lg:w-[400px] flex flex-col bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 h-full shadow-xl z-10">
      {/* Navigation Tabs */}
      <div className="flex px-4 pt-4 pb-2 gap-2 border-b border-slate-100 dark:border-slate-800">
        <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-50 text-blue-700 font-bold text-[13px] border border-blue-100">
          <Receipt className="w-4 h-4" />
          Order
        </button>
        <button
          onClick={onOpenDrawer}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-slate-600 hover:bg-slate-50 font-medium text-[13px] transition-colors border border-transparent"
        >
          <Wallet className="w-4 h-4" />
          Drawer
        </button>
        <button
          onClick={onOpenHistory}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-slate-600 hover:bg-slate-50 font-medium text-[13px] transition-colors border border-transparent"
        >
          <History className="w-4 h-4" />
          History
        </button>
      </div>

      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Current Order
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {ref} • Today, {time}
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                disabled={items.length === 0}
              />
            }
          >
            <Trash2 className="w-4 h-4" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Current Order?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove all items from the cart? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onClearCart}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Clear Cart
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Cart Items */}
      <ScrollArea className="flex-1 px-4 py-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <ShoppingCart className="w-7 h-7 text-slate-200" />
            </div>
            <p className="text-sm font-bold text-slate-400">Cart is empty</p>
            <p className="text-xs text-slate-300 mt-1">
              Select products to start an order
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/20 animate-in fade-in slide-in-from-right-2 duration-300 shadow-sm"
              >
                {/* Thumbnail */}
                <div className="w-[68px] h-[68px] rounded-lg bg-slate-100 dark:bg-slate-900 overflow-hidden relative shrink-0">
                  {item.product.images?.[0] ? (
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 68px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                      <ImageOff className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm truncate pr-2 text-slate-900 dark:text-white leading-tight">
                      {item.product.name}
                    </h4>
                    <span className="font-bold text-sm text-slate-900 dark:text-white shrink-0">
                      ₦
                      {(
                        Number(item.product.sellingPrice) * item.quantity
                      ).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-400">
                    ₦{Number(item.product.sellingPrice).toLocaleString()} / unit
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 rounded-md border-slate-200 hover:bg-slate-50"
                      onClick={() => onUpdateQuantity(item.product.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-black text-slate-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 rounded-md border-slate-200 hover:bg-slate-50"
                      onClick={() => onUpdateQuantity(item.product.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer: Totals + Actions */}
      <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
        {/* Totals */}
        <div className="space-y-2 mb-5">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Subtotal</span>
            <span className="font-medium">₦{subtotal.toLocaleString()}</span>
          </div>

          {/* Discount Field */}
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 rounded-lg p-2 mt-1 mb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  onUpdateDiscount(
                    discount,
                    discountType === "FLAT" ? "PERCENTAGE" : "FLAT",
                  )
                }
                className="text-xs font-bold px-2 py-1 bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                title="Toggle discount type"
              >
                {discountType === "FLAT" ? "₦" : "%"}
              </button>
              <span className="text-sm text-slate-500 font-medium">
                Discount
              </span>
            </div>
            <div className="flex items-center gap-1">
              {discountType === "FLAT" && (
                <span className="text-slate-400 text-sm">₦</span>
              )}
              <input
                type="number"
                min="0"
                value={discount || ""}
                onChange={(e) =>
                  onUpdateDiscount(Number(e.target.value) || 0, discountType)
                }
                placeholder="0"
                className="w-16 text-right bg-transparent border-b border-slate-200 dark:border-slate-700 outline-none text-sm font-medium text-slate-900 dark:text-white focus:border-primary transition-colors"
              />
              {discountType === "PERCENTAGE" && (
                <span className="text-slate-400 text-sm">%</span>
              )}
            </div>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-red-500">
              <span>Discount</span>
              <span className="font-medium">
                - ₦{discountAmount.toLocaleString()}
              </span>
            </div>
          )}

          <div className="flex justify-between text-sm text-slate-500">
            <span>VAT ({taxRatePercent}%)</span>
            <span className="font-medium">₦{vat.toFixed(2)}</span>
          </div>
          <Separator className="my-2 bg-slate-100 dark:bg-slate-800" />
          <div className="flex justify-between items-baseline">
            <span className="text-base font-bold text-slate-900 dark:text-white">
              Total
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              ₦
              {total.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* Customer Selector */}
        <CustomerSelector
          selectedCustomer={selectedCustomer}
          onSelectCustomer={onSelectCustomer}
        />

        {/* Checkout */}
        <Button
          className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-lg shadow-primary/25 hover:shadow-primary/35 active:scale-[0.98] transition-all flex items-center justify-between px-6"
          onClick={onCheckout}
          disabled={items.length === 0}
        >
          <span>Checkout</span>
          <div className="flex items-center gap-2">
            <span className="font-black">
              ₦
              {total.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <ArrowRight className="w-5 h-5" />
          </div>
        </Button>
      </div>
    </div>
  );
};
