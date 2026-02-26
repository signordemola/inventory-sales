"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useProducts } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Plus, Search, Link2 } from "lucide-react";
import Link from "next/link";
import { ProductsTable } from "@/components/products/products-table";

export default function ProductsPage() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const { data, isLoading, isFetching } = useProducts({
    page,
    limit: 20,
    search: search.length >= 3 ? search : undefined,
    categoryId,
  });

  const { data: categories } = useCategories();

  return (
    <div className="flex-1 space-y-8 p-10 h-full overflow-y-auto bg-slate-50/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 font-display text-center sm:text-left">
            Products Management
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1 text-center sm:text-left">
            Manage your inventory, categories, and stock levels.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link href="/owner/products/categories">
            <Button
              variant="outline"
              className="h-11 px-5 rounded-xl font-bold bg-white text-slate-700 border-slate-200 shadow-sm w-full sm:w-auto hover:bg-slate-50"
            >
              <Link2 className="w-4 h-4 mr-2 text-slate-400" /> Manage
              Categories
            </Button>
          </Link>
          <Button
            className="h-11 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-sm w-full sm:w-auto transition-all active:scale-95"
            onClick={() => router.push("/owner/products/new")}
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Product
          </Button>
        </div>
      </div>

      <Card className="bg-white rounded-2xl border-none shadow-xl shadow-slate-200/50 overflow-hidden relative">
        <CardHeader className="border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 space-y-0 py-5 px-6">
          <CardTitle className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="size-5 text-primary" />
            Product Catalog
          </CardTitle>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 h-11 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-slate-700"
              />
            </div>
            <select
              className="h-11 px-4 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Categories</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <ProductsTable
            products={data?.items || []}
            isLoading={isLoading}
            isFetching={isFetching}
            page={page}
            totalItems={data?.meta.total || 0}
            totalPages={data?.meta.totalPages || 0}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
