"use strict";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { PurchaseOrder } from "@/types/suppliers";

export function usePurchaseOrders() {
  return useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const { data } = await apiClient.get<PurchaseOrder[]>("/purchase-orders");
      return data;
    },
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post<PurchaseOrder>(
        "/purchase-orders",
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}

export function useReceivePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const { data } = await apiClient.patch<PurchaseOrder>(
        `/purchase-orders/${id}/receive`,
        payload,
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({
        queryKey: ["purchase-order", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
