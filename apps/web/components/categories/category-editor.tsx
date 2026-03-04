"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Category,
  useCreateCategory,
  useUpdateCategory,
} from "@/hooks/use-categories";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Folder, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { CategoryInput, CategorySchema } from "@/schemas/category";

interface CategoryEditorProps {
  selectedCategoryId: string | null;
  isCreating: boolean;
  categories: Category[];
  onCancel: () => void;
  onCreateSuccess: () => void;
  onUpdateSuccess: (categoryId: string) => void;
  initialParentId?: string;
}

export const CategoryEditor = ({
  selectedCategoryId,
  isCreating,
  categories,
  onCancel,
  onCreateSuccess,
  onUpdateSuccess,
}: CategoryEditorProps) => {
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory(selectedCategoryId || "temp");

  const category = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)
    : null;

  const form = useForm<CategoryInput>({
    resolver: zodResolver(CategorySchema),
    defaultValues: {
      name: category?.name || "",
      description: category?.description || "",
    },
  });

  const onSubmit = async (values: CategoryInput) => {
    try {
      if (isCreating) {
        await createMutation.mutateAsync({
          name: values.name,
          description: values.description || undefined,
        });
        toast.success("Category created successfully");
        form.reset({ name: "", description: "" });
        onCreateSuccess();
      } else if (selectedCategoryId) {
        await updateMutation.mutateAsync({
          name: values.name,
          description: values.description || undefined,
        });
        toast.success("Category updated");
        onUpdateSuccess(selectedCategoryId);
      }
    } catch (error) {
      const e = error as AxiosError<{ message: string }>;
      toast.error(e?.response?.data?.message || "Failed to save category");
    }
  };

  // Empty state
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
            Choose a category from the list on the left to edit it, or create a
            new one.
          </p>
        </div>
      </div>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-100">
        <h2 className="text-2xl font-black text-slate-900">
          {isCreating
            ? "New Category"
            : `Edit: ${category?.name || "Category"}`}
        </h2>
        <p className="text-sm font-semibold text-slate-400 mt-0.5">
          {isCreating
            ? "Fill in the details below to add a new category."
            : "Update the details and save your changes."}
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col flex-1 overflow-hidden"
      >
        <div className="p-8 flex-1 overflow-y-auto">
          <div className="max-w-xl">
            <FieldGroup>
              {/* Name */}
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor={field.name}>
                        Category Name{" "}
                        <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        placeholder="e.g. Beverages"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </FieldContent>
                  </Field>
                )}
              />

              {/* Description */}
              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor={field.name}>
                        Description{" "}
                        <span className="text-muted-foreground font-normal">
                          (Optional)
                        </span>
                      </FieldLabel>
                      <textarea
                        {...field}
                        id={field.name}
                        rows={4}
                        placeholder="What kinds of products belong here?"
                        aria-invalid={fieldState.invalid}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none transition-colors"
                      />
                      <p className="text-right text-xs text-muted-foreground">
                        {(field.value ?? "").length}/500 characters
                      </p>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </FieldContent>
                  </Field>
                )}
              />
            </FieldGroup>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-11 px-6 rounded-xl font-bold"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="h-11 px-8 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 gap-2 transition-all"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isCreating ? "Create Category" : "Save Changes"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
