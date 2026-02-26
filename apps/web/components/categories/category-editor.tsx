"use client";

import { useState } from "react";
import {
  Category,
  useCreateCategory,
  useUpdateCategory,
} from "@/hooks/use-categories";
import { Folder, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AxiosError } from "axios";

interface CategoryEditorProps {
  selectedCategoryId: string | null;
  isCreating: boolean;
  categories: Category[];
  onCancel: () => void;
  onSuccess: (categoryId: string) => void;
  initialParentId?: string;
}

export const CategoryEditor = ({
  selectedCategoryId,
  isCreating,
  categories,
  onCancel,
  onSuccess,
  initialParentId,
}: CategoryEditorProps) => {
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory(selectedCategoryId || "temp");

  const category = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)
    : null;

  const [name, setName] = useState(category?.name || "");
  const [slug, setSlug] = useState(category?.slug || "");
  const [description, setDescription] = useState(category?.description || "");
  const [parentId, setParentId] = useState<string>(
    category?.parentId || initialParentId || "",
  );

  const handleNameChange = (newName: string) => {
    setName(newName);
    if (isCreating) {
      setSlug(
        newName
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      );
    }
  };

  const saveAction = async () => {
    if (!name.trim()) return toast.error("Category name is required.");
    if (!slug.trim()) return toast.error("URL Slug is required.");

    const payload = {
      name,
      slug,
      description: description.trim() || undefined,
      parentId: parentId || undefined,
    };

    try {
      if (isCreating) {
        const result = await createMutation.mutateAsync(payload);
        toast.success("Category created successfully");
        onSuccess(result.id);
      } else if (selectedCategoryId) {
        await updateMutation.mutateAsync({
          ...payload,
          parentId: parentId ? parentId : null,
        });
        toast.success("Category updated");
        onSuccess(selectedCategoryId);
      }
    } catch (error) {
      const e = error as AxiosError<{ message: string }>;
      toast.error(e?.response?.data?.message || "Failed to save category");
    }
  };

  if (!selectedCategoryId && !isCreating) {
    return (
      <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/30">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Folder className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">
            Select a category
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            Choose a category from the tree on the left to edit its details, or
            create a new one.
          </p>
        </div>
      </div>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            {isCreating ? "New Category" : name || "Category"}
          </h2>
          <div className="flex items-center gap-2 mt-1.5 text-xs font-semibold text-slate-400">
            {parentId && (
              <>
                <span>
                  {categories.find((c) => c.id === parentId)?.name || "Unknown"}
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
            <span
              className={isCreating ? "text-emerald-500" : "text-slate-600"}
            >
              {isCreating ? "Unsaved" : name}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-10 rounded-xl font-bold"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            className="h-10 px-6 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
            onClick={saveAction}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>

      <div className="p-8 flex-1 overflow-y-auto">
        <div className="max-w-3xl space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-bold text-slate-700 mb-2 block">
                Category Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Liquid Milk"
                className="h-11 rounded-xl bg-slate-50 border-slate-200 font-medium"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 mb-2 block">
                Parent Category
              </label>
              <select
                className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
              >
                <option value="">None (Top Level)</option>
                {categories
                  .filter((c) => c.id !== selectedCategoryId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block">
              URL Slug
            </label>
            <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-slate-50 focus-within:ring-2 focus-within:ring-primary/20">
              <div className="px-4 py-2.5 bg-slate-100 border-r border-slate-200 text-slate-400 text-sm font-medium flex items-center whitespace-nowrap">
                naijastock.com/c/
              </div>
              <input
                type="text"
                className="flex-1 bg-transparent px-4 py-2.5 text-sm font-medium outline-none text-slate-700"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block">
              Description{" "}
              <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={4}
              placeholder="Enter a description for this category..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y font-medium"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="text-right text-xs text-slate-400 mt-1.5 font-semibold">
              {description.length}/500 characters
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
