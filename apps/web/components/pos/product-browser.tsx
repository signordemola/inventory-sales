"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Search, QrCode, WifiOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProductCard } from "./product-card";
import { Product, Category } from "@/types/products";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { ScannerModal } from "./scanner-modal";
import { useUsbScanner } from "@/hooks/use-usb-scanner";

interface ProductBrowserProps {
  onSelectProduct: (product: Product) => void;
}

export const ProductBrowser = ({ onSelectProduct }: ProductBrowserProps) => {
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | undefined
  >();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Handle a successful scan from either the camera or USB scanner
  const handleScan = async (barcode: string) => {
    // Attempt to find the product in IndexedDB
    const product = await db.products.where("barcode").equals(barcode).first();

    if (product) {
      onSelectProduct(product);
      setIsScannerOpen(false); // Close camera modal if open
    } else {
      toast.error(`Product not found for barcode: ${barcode}`);
    }
  };

  // Listen globally for USB scanner input
  useUsbScanner(handleScan);

  const isOnline = React.useSyncExternalStore(
    React.useCallback((callback: () => void) => {
      window.addEventListener("online", callback);
      window.addEventListener("offline", callback);
      return () => {
        window.removeEventListener("online", callback);
        window.removeEventListener("offline", callback);
      };
    }, []),
    () => navigator.onLine,
    () => true,
  );

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
    <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-slate-50 dark:bg-slate-900/50">
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
            onClick={() => setIsScannerOpen(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary h-8 w-8"
          >
            <QrCode className="w-4 h-4" />
          </Button>
        </div>

        {/* Category Pills with fade indicator */}
        <div className="relative mt-3">
          <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar pr-8 mask-[linear-gradient(to_right,white_90%,transparent_100%)]">
            <button
              onClick={() => setSelectedCategoryId(undefined)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
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
                className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
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
      </div>

      {/* Product Grid */}
      <ScrollArea className="flex-1 p-5">
        {isLoading ? (
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={`prod-skel-${n}`}
                className="p-3 border rounded-xl bg-white space-y-3"
              >
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
          <div
            className="grid gap-3 pb-12"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            }}
          >
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

      {/* Camera Barcode Scanner Modal */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
      />
    </div>
  );
};
