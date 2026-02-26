"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { Category } from "@/types/products";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await apiClient.get<Category[]>("/categories");
      return data;
    },
  });
}
