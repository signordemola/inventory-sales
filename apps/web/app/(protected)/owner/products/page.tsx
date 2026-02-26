"use client";

import React from "react";
import { useProducts } from "@/hooks/use-products";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Search, Filter } from "lucide-react";

const ProductsPage = () => {
  const { data: products, isLoading } = useProducts();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight text-center sm:text-left">
            Products Management
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1 text-center sm:text-left">
            Manage your inventory, categories, and stock levels.
          </p>
        </div>
        <button className="bg-primary text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto">
          <Plus className="size-5" />
          Add Product
        </button>
      </div>

      <Card className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <CardHeader className="border-b border-gray-50 bg-gray-50/30 flex flex-col sm:flex-row items-center justify-between gap-4 space-y-0 py-4">
          <CardTitle className="text-sm font-bold text-foreground tracking-tight uppercase flex items-center gap-2">
            <Package className="size-4 text-primary" />
            Product Catalog
          </CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <button className="p-2 rounded-lg border border-border bg-slate-50 hover:bg-slate-100 transition-colors">
              <Filter className="size-4 text-slate-600" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border bg-slate-50/50">
                  <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                    Product
                  </TableHead>
                  <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                    SKU
                  </TableHead>
                  <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                    Category
                  </TableHead>
                  <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider text-right">
                    Price
                  </TableHead>
                  <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider text-center">
                    Stock
                  </TableHead>
                  <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider text-center">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-4 w-16 ml-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="h-4 w-12 mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="h-4 w-20 mx-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                ) : products?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-sm font-bold text-muted-foreground uppercase tracking-widest italic pt-12"
                    >
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  products?.map((product) => (
                    <TableRow
                      key={product.id}
                      className="cursor-pointer hover:bg-slate-50/50 border-b border-border/50 group transition-colors"
                    >
                      <TableCell className="font-bold text-slate-900">
                        {product.name}
                      </TableCell>
                      <TableCell className="font-mono text-[10px] font-bold text-slate-500">
                        {product.sku}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-500 italic text-sm">
                        {product.category?.name || "Uncategorized"}
                      </TableCell>
                      <TableCell className="text-right font-black text-slate-900">
                        {formatCurrency(product.salePrice)}
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-900">
                        {product.stockLevel}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={`rounded-full px-2 py-0 text-[10px] font-black border-0 shadow-none h-5 ${
                            product.stockLevel <= 0
                              ? "bg-red-100 text-red-700"
                              : product.stockLevel <=
                                  (product.lowStockThreshold || 5)
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {product.stockLevel <= 0
                            ? "OUT OF STOCK"
                            : product.stockLevel <=
                                (product.lowStockThreshold || 5)
                              ? "LOW STOCK"
                              : "IN STOCK"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductsPage;
