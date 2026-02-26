"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/products";
import { Package } from "lucide-react";
import Image from "next/image";

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard = ({ product, onSelect }: ProductCardProps) => {
  const stockQty = product.stockRecord?.quantity ?? 0;
  const isLowStock = stockQty <= product.lowStockThreshold && stockQty > 0;
  const isOutOfStock = stockQty === 0;

  const stockLabel =
    stockQty >= 200
      ? "200+ in stock"
      : stockQty === 1
        ? "1 in stock"
        : `${stockQty} in stock`;

  return (
    <Card
      className={`group p-3 border-slate-200 dark:border-slate-800 transition-all cursor-pointer bg-white dark:bg-slate-950 shadow-sm flex flex-col h-full ${
        isOutOfStock
          ? "opacity-60 cursor-not-allowed"
          : "hover:border-primary hover:shadow-md"
      }`}
      onClick={() => !isOutOfStock && onSelect(product)}
    >
      <div className="aspect-square rounded-xl bg-slate-100 dark:bg-slate-900 mb-3 overflow-hidden relative">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
            <Package className="w-10 h-10" />
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/60 dark:bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center">
            <Badge variant="destructive" className="font-bold text-[10px]">
              OUT OF STOCK
            </Badge>
          </div>
        )}
      </div>

      <div className="space-y-1 mt-auto">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 min-h-[40px] leading-snug">
          {product.name}
        </h3>
        <p className="text-primary font-black text-base">
          ₦{Number(product.sellingPrice).toLocaleString()}
        </p>
        <p
          className={`text-xs font-semibold ${
            isOutOfStock
              ? "text-red-500"
              : isLowStock
                ? "text-amber-500"
                : "text-slate-400"
          }`}
        >
          {isOutOfStock ? "Out of stock" : stockLabel}
        </p>
      </div>
    </Card>
  );
};
