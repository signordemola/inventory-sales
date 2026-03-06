"use client";

import React, { useReducer } from "react";
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

type CategoryState = {
  search: string;
  selectedCategoryId: string | null;
  isCreating: boolean;
  initialParentId: string | undefined;
  pendingDeleteId: string | null;
};

type CategoryAction =
  | { type: "SET_SEARCH"; payload: string }
  | { type: "CREATE_NEW" }
  | { type: "CREATE_CHILD"; payload: string }
  | { type: "SELECT_CATEGORY"; payload: string }
  | { type: "SET_PENDING_DELETE"; payload: string | null }
  | { type: "CANCEL_CREATION" }
  | { type: "SUCCESS_CREATE" };

const initialState: CategoryState = {
  search: "",
  selectedCategoryId: null,
  isCreating: false,
  initialParentId: undefined,
  pendingDeleteId: null,
};

function categoryReducer(
  state: CategoryState,
  action: CategoryAction,
): CategoryState {
  switch (action.type) {
    case "SET_SEARCH":
      return { ...state, search: action.payload };
    case "CREATE_NEW":
      return {
        ...state,
        selectedCategoryId: null,
        initialParentId: undefined,
        isCreating: true,
      };
    case "CREATE_CHILD":
      return {
        ...state,
        selectedCategoryId: null,
        initialParentId: action.payload,
        isCreating: true,
      };
    case "SELECT_CATEGORY":
      return {
        ...state,
        selectedCategoryId: action.payload,
        isCreating: false,
        initialParentId: undefined,
      };
    case "SET_PENDING_DELETE":
      return { ...state, pendingDeleteId: action.payload };
    case "CANCEL_CREATION":
      return { ...state, isCreating: false, initialParentId: undefined };
    case "SUCCESS_CREATE":
      return {
        ...state,
        isCreating: true,
        selectedCategoryId: null,
        initialParentId: undefined,
      };
    default:
      return state;
  }
}

export default function CategoriesPage() {
  const router = useRouter();
  const { data: categories = [], isLoading } = useCategories();
  const deleteMutation = useDeleteCategory();

  const [state, dispatch] = useReducer(categoryReducer, initialState);

  const handleCreateNew = () => dispatch({ type: "CREATE_NEW" });
  const handleCreateChild = (parentId: string) =>
    dispatch({ type: "CREATE_CHILD", payload: parentId });
  const handleSelect = (id: string) =>
    dispatch({ type: "SELECT_CATEGORY", payload: id });
  const handleDelete = (id: string) =>
    dispatch({ type: "SET_PENDING_DELETE", payload: id });
  const handleCancel = () => dispatch({ type: "CANCEL_CREATION" });
  const handleCreateSuccess = () => dispatch({ type: "SUCCESS_CREATE" });
  const handleUpdateSuccess = (id: string) =>
    dispatch({ type: "SELECT_CATEGORY", payload: id });

  const confirmDelete = async () => {
    if (!state.pendingDeleteId) return;
    try {
      await deleteMutation.mutateAsync(state.pendingDeleteId);
      toast.success("Category deleted");
      if (state.selectedCategoryId === state.pendingDeleteId) {
        dispatch({ type: "SELECT_CATEGORY", payload: "" }); // Clear selection if deleted
      }
    } catch {
      toast.error(
        "Failed to delete category. It may still have products assigned.",
      );
    } finally {
      dispatch({ type: "SET_PENDING_DELETE", payload: null });
    }
  };

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 h-full overflow-y-auto bg-white dark:bg-slate-950">
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
              value={state.search}
              onChange={(e) =>
                dispatch({ type: "SET_SEARCH", payload: e.target.value })
              }
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        <CategoryTree
          categories={categories}
          isLoading={isLoading}
          search={state.search}
          selectedCategoryId={state.selectedCategoryId}
          isCreating={state.isCreating}
          onSelect={handleSelect}
          onCreateChild={handleCreateChild}
          onCreateNew={handleCreateNew}
          onDelete={handleDelete}
        />
        <CategoryEditor
          key={
            state.isCreating
              ? "__new__"
              : (state.selectedCategoryId ?? "__empty__")
          }
          selectedCategoryId={state.selectedCategoryId}
          isCreating={state.isCreating}
          categories={categories}
          initialParentId={state.initialParentId}
          onCancel={handleCancel}
          onCreateSuccess={handleCreateSuccess}
          onUpdateSuccess={handleUpdateSuccess}
        />
      </div>

      <AlertDialog
        open={!!state.pendingDeleteId}
        onOpenChange={(open) => {
          if (!open) dispatch({ type: "SET_PENDING_DELETE", payload: null });
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
            <AlertDialogCancel
              onClick={() =>
                dispatch({ type: "SET_PENDING_DELETE", payload: null })
              }
            >
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
