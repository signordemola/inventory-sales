"use client";

import React, { useState } from "react";
import { useCategories, useDeleteCategory } from "@/hooks/use-categories";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { CategoryTree } from "@/components/categories/category-tree";
import { CategoryEditor } from "@/components/categories/category-editor";

export default function CategoryManagementPage() {
  const { data: categories = [], isLoading } = useCategories();
  const deleteMutation = useDeleteCategory();

  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(false);
  const [initialParentId, setInitialParentId] = useState<string>("");

  const handleCreateNew = () => {
    setSelectedCategoryId(null);
    setIsCreating(true);
    setInitialParentId("");
  };

  const handleCreateChild = (parentId: string) => {
    setSelectedCategoryId(null);
    setIsCreating(true);
    setInitialParentId(parentId);
  };

  const handleSelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setIsCreating(false);
  };

  const handleCancelEditor = () => {
    setIsCreating(false);
    if (!selectedCategoryId && categories.length > 0) {
      setSelectedCategoryId(categories[0].id);
    }
  };

  const handleEditorSuccess = (categoryId: string) => {
    setIsCreating(false);
    setSelectedCategoryId(categoryId);
  };

  const handleDelete = async (id: string) => {
    if (
      confirm(
        "Are you sure you want to delete this category? Products within it will lose this assignment.",
      )
    ) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("Category deleted");
        if (selectedCategoryId === id) setSelectedCategoryId(null);
      } catch {
        toast.error("Failed to delete category");
      }
    }
  };

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 h-full overflow-y-auto bg-slate-50/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 mb-4">
            <Link
              href="/owner/products"
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Products
            </Link>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 font-display">
            Category Management
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Organize products into hierarchical categories.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search categories..."
              className="pl-9 h-11 w-64 rounded-xl bg-white border-slate-200 focus-visible:ring-primary/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            className="h-11 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white transition-all active:scale-95 shadow-sm"
            onClick={handleCreateNew}
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add New Category
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[calc(100vh-220px)] border-none">
        <CategoryTree
          categories={categories}
          isLoading={isLoading}
          search={search}
          selectedCategoryId={selectedCategoryId}
          isCreating={isCreating}
          onSelect={handleSelect}
          onCreateChild={handleCreateChild}
          onCreateNew={handleCreateNew}
          onDelete={handleDelete}
        />

        <CategoryEditor
          key={selectedCategoryId || (isCreating ? "new-cat" : "empty")}
          selectedCategoryId={selectedCategoryId}
          isCreating={isCreating}
          categories={categories}
          initialParentId={initialParentId}
          onCancel={handleCancelEditor}
          onSuccess={handleEditorSuccess}
        />
      </div>
    </div>
  );
}
