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
    staleTime: 1000 * 60 * 5, // 5 minutes
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
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateProductPayload) => {
      const { data } = await apiClient.post<Product>("/products", payload);
      return data;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["products"] });
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
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["products"] });
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
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-levels"] });
    },
  });
}

export function useUploadProductImage(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await apiClient.post<{ url: string }>(
        `/products/${id}/images`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return data;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProductImage(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (publicId: string) => {
      await apiClient.delete(
        `/products/${id}/images/${encodeURIComponent(publicId)}`,
      );
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["products"] });
    },
  });
}
