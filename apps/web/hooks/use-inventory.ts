"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StockMovementType = "IN" | "OUT" | "ADJUSTMENT";

export interface StockLevelProduct {
  id: string;
  name: string;
  sku: string | null;
  salePrice: string | number;
  lowStockThreshold: number;
  images: string[];
}

export interface StockLevel {
  id: string;
  productId: string;
  quantity: number;
  updatedAt: string;
  product: StockLevelProduct;
}

export interface StockMovementUser {
  id: string;
  name: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  reason: string | null;
  cost: number | null;
  createdAt: string;
  product: { id: string; name: string; sku: string | null };
  user: StockMovementUser | null;
}

export interface PaginatedMovements {
  items: StockMovement[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface AdjustStockPayload {
  productId: string;
  variantId?: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  cost?: number;
  supplierId?: string;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useInventoryLevels() {
  return useQuery<StockLevel[]>({
    queryKey: ["inventory-levels"],
    queryFn: async () => {
      const { data } = await apiClient.get<StockLevel[]>("/inventory/levels");
      return data;
    },
  });
}

export function useInventoryHistory(params?: {
  page?: number;
  limit?: number;
  productId?: string;
}) {
  return useQuery<PaginatedMovements>({
    queryKey: ["inventory-history", params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedMovements>(
        "/inventory/history",
        {
          params: { page: 1, limit: 20, ...params },
        },
      );
      return data;
    },
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AdjustStockPayload) => {
      const { data } = await apiClient.post("/inventory/adjust", payload);
      return data;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["inventory-levels"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-history"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}
