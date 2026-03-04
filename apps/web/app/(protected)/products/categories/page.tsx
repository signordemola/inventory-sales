"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCategories, useDeleteCategory } from "@/hooks/use-categories";
import { CategoryTree } from "@/components/categories/category-tree";
import { CategoryEditor } from "@/components/categories/category-editor";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { toast } from "sonner";

export default function CategoriesPage() {
  const router = useRouter();
  const { data: categories = [], isLoading } = useCategories();
  const deleteMutation = useDeleteCategory();

  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(false);
  const [initialParentId, setInitialParentId] = useState<string | undefined>();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleCreateNew = () => {
    setSelectedCategoryId(null);
    setInitialParentId(undefined);
    setIsCreating(true);
  };

  const handleCreateChild = (parentId: string) => {
    setSelectedCategoryId(null);
    setInitialParentId(parentId);
    setIsCreating(true);
  };

  const handleSelect = (id: string) => {
    setSelectedCategoryId(id);
    setIsCreating(false);
    setInitialParentId(undefined);
  };

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteMutation.mutateAsync(pendingDeleteId);
      toast.success("Category deleted");
      if (selectedCategoryId === pendingDeleteId) setSelectedCategoryId(null);
    } catch {
      toast.error(
        "Failed to delete category. It may still have products assigned.",
      );
    } finally {
      setPendingDeleteId(null);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setInitialParentId(undefined);
  };

  // Called after CREATING a category — stay in create mode ready for next entry
  const handleCreateSuccess = () => {
    setIsCreating(true);
    setSelectedCategoryId(null);
    setInitialParentId(undefined);
  };

  // Called after UPDATING a category — stay in edit mode
  const handleUpdateSuccess = (id: string) => {
    setSelectedCategoryId(id);
    setIsCreating(false);
    setInitialParentId(undefined);
  };

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 h-full overflow-y-auto bg-slate-50/30">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="h-10 w-10 p-0 rounded-xl shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 font-display text-left">
              Category Manager
            </h1>
            <p className="text-sm font-semibold text-slate-500 mt-1 text-left">
              Organise your product taxonomy with nested categories.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search categories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 h-11 w-full rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-slate-700"
            />
          </div>
          <Button
            className="h-11 px-5 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-sm w-full sm:w-auto transition-all active:scale-95 shrink-0"
            onClick={handleCreateNew}
          >
            <Plus className="w-4 h-4 mr-1.5" /> New Category
          </Button>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
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
          key={isCreating ? "__new__" : (selectedCategoryId ?? "__empty__")}
          selectedCategoryId={selectedCategoryId}
          isCreating={isCreating}
          categories={categories}
          initialParentId={initialParentId}
          onCancel={handleCancel}
          onCreateSuccess={handleCreateSuccess}
          onUpdateSuccess={handleUpdateSuccess}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!pendingDeleteId}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Products in this category will
              become uncategorised.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingDeleteId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
