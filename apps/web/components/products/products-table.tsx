"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Package, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Product } from "@/hooks/use-products";
import { cn } from "@/lib/utils";

interface ProductsTableProps {
  products: Product[];
  isLoading: boolean;
  isFetching: boolean;
  page: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export const ProductsTable = ({
  products,
  isLoading,
  isFetching,
  page,
  totalItems,
  totalPages,
  onPageChange,
}: ProductsTableProps) => {
  const router = useRouter();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };

  return (
    <div className="relative">
      {isFetching && !isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Product
              </th>
              <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                SKU / Barcode
              </th>
              <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Category
              </th>
              <th className="text-right px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Price (₦)
              </th>
              <th className="text-center px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Stock
              </th>
              <th className="text-center px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              Array(5)
                .fill(0)
                .map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-5 py-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-5 py-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </td>
                    <td className="px-5 py-4">
                      <Skeleton className="h-4 w-12 mx-auto" />
                    </td>
                    <td className="px-5 py-4">
                      <Skeleton className="h-5 w-20 mx-auto rounded-full" />
                    </td>
                  </tr>
                ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-24 text-center">
                  <div className="inline-flex w-16 h-16 rounded-full bg-slate-50 items-center justify-center mb-4">
                    <Package className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-500">
                    No products found
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try adjusting your filters or add a new product.
                  </p>
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const catName = product.category?.name || "Uncategorized";

                return (
                  <tr
                    key={product.id}
                    className="cursor-pointer hover:bg-slate-50/50 transition-colors group"
                    onClick={() => router.push(`/products/${product.id}`)}
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                          {product.images && product.images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.images[0]}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                        <span className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="font-mono text-xs font-bold text-slate-600">
                        {product.sku}
                      </p>
                      {product.barcode && (
                        <p className="font-mono text-[10px] text-slate-400">
                          {product.barcode}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap font-semibold text-slate-500 text-xs">
                      {catName}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right font-black text-slate-900 text-[13.5px]">
                      {formatCurrency(product.sellingPrice)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center font-bold text-slate-900">
                      {product.stockLevel}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <div
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          product.stockLevel <= 0
                            ? "bg-red-50 text-red-600"
                            : product.stockLevel <=
                                (product.lowStockThreshold || 5)
                              ? "bg-amber-50 text-amber-600"
                              : "bg-emerald-50 text-emerald-600",
                        )}
                      >
                        <div
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            product.stockLevel <= 0
                              ? "bg-red-500"
                              : product.stockLevel <=
                                  (product.lowStockThreshold || 5)
                                ? "bg-amber-500"
                                : "bg-emerald-500",
                          )}
                        />
                        {product.stockLevel <= 0
                          ? "Out of Stock"
                          : product.stockLevel <=
                              (product.lowStockThreshold || 5)
                            ? "Low Stock"
                            : "In Stock"}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-5 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-500">
            Showing{" "}
            <span className="text-slate-900 font-bold">
              {(page - 1) * 20 + 1}
            </span>{" "}
            to{" "}
            <span className="text-slate-900 font-bold">
              {Math.min(page * 20, totalItems)}
            </span>{" "}
            of <span className="text-slate-900 font-bold">{totalItems}</span>{" "}
            products
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-lg border-slate-200"
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500 text-white font-bold text-sm">
              {page}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-lg border-slate-200"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
