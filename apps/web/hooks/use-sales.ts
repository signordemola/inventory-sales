"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";

export interface CreateSaleItem {
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
}

export interface CreatePayment {
  method: "CASH" | "CARD" | "TRANSFER" | "PAYSTACK" | "CREDIT";
  amount: number;
  reference?: string;
}

export interface CreateSalePayload {
  customerId?: string;
  items: CreateSaleItem[];
  payments: CreatePayment[];
  discount?: number;
  discountType?: string;
  notes?: string;
}

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateSalePayload) => {
      const { data } = await apiClient.post("/sales", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}
