"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { Product } from "@/types/products";

export function useProducts(params?: { search?: string; categoryId?: string }) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: Product[] }>("/products", {
        params: {
          ...params,
          limit: 100, // Fetch more for POS
        },
      });
      return data.items;
    },
  });
}
