"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug?: string;
  description: string | null;
  parentId: string | null;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateCategoryPayload {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
}

interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
  description?: string | null;
  parentId?: string | null;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await apiClient.get<Category[]>("/categories");
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateCategoryPayload) => {
      const { data } = await apiClient.post<Category>("/categories", payload);
      return data;
    },
    onSuccess: async () => {
      // refetchQueries awaits the fresh data — invalidateQueries only marks stale
      await queryClient.refetchQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateCategoryPayload) => {
      const { data } = await apiClient.patch<Category>(
        `/categories/${id}`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
