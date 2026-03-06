"use client";

import React, { useMemo } from "react";
import { Folder, Plus, Trash2, Loader2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Category } from "@/hooks/use-categories";

interface CategoryNode extends Category {
  children: CategoryNode[];
}

function buildTree(categories: Category[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>();
  const roots: CategoryNode[] = [];

  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] });
  });

  categories.forEach((cat) => {
    const node = map.get(cat.id)!;
    if (cat.parentId) {
      const parent = map.get(cat.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

interface CategoryTreeProps {
  categories: Category[];
  isLoading: boolean;
  search: string;
  selectedCategoryId: string | null;
  isCreating: boolean;
  onSelect: (categoryId: string) => void;
  onCreateChild: (parentId: string) => void;
  onCreateNew: () => void;
  onDelete: (categoryId: string) => void;
}

export const CategoryTree = ({
  categories,
  isLoading,
  search,
  selectedCategoryId,
  isCreating,
  onSelect,
  onCreateChild,
  onCreateNew,
  onDelete,
}: CategoryTreeProps) => {
  const tree = useMemo(() => {
    if (!search) return buildTree(categories);
    const filtered = categories.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()),
    );
    return buildTree(filtered); // Simple flat display for search
  }, [categories, search]);

  const flatListWhenSearching = useMemo(() => {
    return categories.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [categories, search]);

  const renderNode = (node: CategoryNode, depth = 0) => {
    const isSelected = selectedCategoryId === node.id && !isCreating;

    return (
      <div key={node.id}>
        <div
          className={cn(
            "group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors my-0.5",
            isSelected
              ? "bg-emerald-50 text-emerald-900 border border-emerald-100"
              : "hover:bg-slate-50 text-slate-700",
          )}
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
          onClick={() => onSelect(node.id)}
        >
          <div className="flex items-center gap-2">
            {node.children.length > 0 ? (
              <ChevronRight
                className={cn(
                  "w-3.5 h-3.5 text-slate-400 opacity-50 transition-transform",
                  isSelected && "rotate-90 text-emerald-500",
                )}
              />
            ) : (
              <div className="w-3.5" />
            )}
            <Folder
              className={cn(
                "w-4 h-4",
                isSelected
                  ? "text-emerald-500 fill-emerald-500/20"
                  : "text-slate-400",
              )}
            />
            <span
              className={cn("text-sm font-semibold", isSelected && "font-bold")}
            >
              {node.name}
            </span>
          </div>

          <div
            className={cn(
              "flex items-center gap-1 opacity-0 transition-opacity",
              isSelected && "opacity-100",
              "group-hover:opacity-100",
            )}
          >
            <button
              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onCreateChild(node.id);
              }}
              title="Add subcategory"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node.id);
              }}
              title="Delete category"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {node.children.length > 0 && (
          <div className="relative">
            <div
              className="absolute left-[20px] top-0 bottom-0 w-px bg-slate-100"
              style={{ left: `${depth * 20 + 20}px` }}
            />
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 dark:border-slate-800 shadow-none h-full flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h2 className="font-bold text-slate-900 text-sm">Category Tree</h2>
      </div>

      <div className="p-3 overflow-y-auto flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <Folder className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-sm font-bold text-slate-500">
              No categories found
            </p>
            <button
              className="text-xs text-emerald-600 font-bold mt-2"
              onClick={onCreateNew}
            >
              Create your first category
            </button>
          </div>
        ) : search ? (
          flatListWhenSearching.length > 0 ? (
            flatListWhenSearching.map((cat) =>
              renderNode({ ...cat, children: [] }, 0),
            )
          ) : (
            <p className="text-xs text-slate-400 text-center py-6">
              No matches found
            </p>
          )
        ) : (
          tree.map((node) => renderNode(node, 0))
        )}
      </div>
    </div>
  );
};
