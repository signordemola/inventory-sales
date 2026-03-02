"use client";

import React, { useState, useEffect, RefObject } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Search, QrCode, WifiOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProductCard } from "./product-card";
import { Product, Category } from "@/types/products";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";

interface ProductBrowserProps {
  onSelectProduct: (product: Product) => void;
  searchInputRef?: RefObject<HTMLInputElement | null>;
}

export const ProductBrowser = ({ onSelectProduct, searchInputRef }: ProductBrowserProps) => {
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | undefined
  >();
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  // Reactive product query from IndexedDB — updates instantly, no network
  const products = useLiveQuery(async (): Promise<Product[]> => {
    let query = db.products.toCollection();

    if (selectedCategoryId) {
      query = db.products.where("categoryId").equals(selectedCategoryId);
    }

    const all = await query.toArray();

    if (!search.trim()) return all.slice(0, 60);

    const q = search.toLowerCase();
    return all
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.barcode === search,
      )
      .slice(0, 60);
  }, [search, selectedCategoryId]);

  // Reactive category list from IndexedDB
  const categories = useLiveQuery(
    async (): Promise<Category[]> => db.categories.toArray(),
    [],
  );

  const isLoading = products === undefined;
  const isEmpty = !isLoading && (products?.length ?? 0) === 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-900/50">
      {/* Search + Category Bar */}
      <div className="px-5 py-4 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        {/* Offline indicator */}
        {!isOnline && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg mb-3 border border-orange-100">
            <WifiOff className="h-3.5 w-3.5" />
            Offline — showing cached products
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, SKU or scan barcode..."
            className="pl-10 pr-12 h-11 bg-slate-50 border-slate-200 focus:ring-primary focus:border-primary rounded-xl text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary h-8 w-8"
          >
            <QrCode className="w-4 h-4" />
          </Button>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-0.5 no-scrollbar">
          <button
            onClick={() => setSelectedCategoryId(undefined)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              !selectedCategoryId
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            All Items
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                selectedCategoryId === cat.id
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <ScrollArea className="flex-1 p-5">
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="p-3 border rounded-xl bg-white space-y-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-slate-300" />
            </div>
            <h3 className="font-bold text-slate-500">No products found</h3>
            <p className="text-sm text-slate-400 mt-1">
              {isOnline
                ? "Try adjusting your search or filters"
                : "No cached products yet — please connect once to seed the local database"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-12">
            {products?.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={onSelectProduct}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
