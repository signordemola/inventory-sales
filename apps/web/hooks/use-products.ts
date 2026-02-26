"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { Product } from "@/types/products";

export type { Product };

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaginatedProducts {
  items: Product[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
}

export interface CreateProductPayload {
  name: string;
  sku: string;
  categoryId?: string;
  description?: string;
  barcode?: string;
  unit?: string;
  buyingPrice?: number;
  sellingPrice?: number;
  lowStockThreshold?: number;
  isActive?: boolean;
  images?: string[];
}

export type UpdateProductPayload = Partial<CreateProductPayload>;

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useProducts(filters?: ProductFilters) {
  return useQuery<PaginatedProducts>({
    queryKey: ["products", filters],
    queryFn: async () => {
      // Remove undefined/empty values so they don't clog the URL
      const cleanFilters = Object.fromEntries(
        Object.entries(filters || {}).filter(
          ([key, v]) => key && v !== undefined && v !== "",
        ),
      );

      const { data } = await apiClient.get<PaginatedProducts>("/products", {
        params: { page: 1, limit: 100, ...cleanFilters },
      });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useProduct(id: string) {
  return useQuery<Product>({
    queryKey: ["products", id],
    queryFn: async () => {
      const { data } = await apiClient.get<Product>(`/products/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateProductPayload) => {
      const { data } = await apiClient.post<Product>("/products", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-levels"] });
    },
  });
}

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateProductPayload) => {
      const { data } = await apiClient.patch<Product>(
        `/products/${id}`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-levels"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-levels"] });
    },
  });
}
