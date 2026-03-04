"use strict";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { PurchaseOrder } from "@/types/suppliers";
import { POFormData } from "@/schemas/suppliers";

interface CreatePOPayload extends POFormData {
  items: { productId: string; quantity: number; cost: number }[];
}

interface ReceivePOPayload {
  items: { id: string; receivedQty: number }[];
  notes?: string;
}

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
    mutationFn: async (payload: CreatePOPayload) => {
      const { data } = await apiClient.post<PurchaseOrder>(
        "/purchase-orders",
        payload,
      );
      return data;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}

export function useReceivePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: ReceivePOPayload;
    }) => {
      const { data } = await apiClient.patch<PurchaseOrder>(
        `/purchase-orders/${id}/receive`,
        payload,
      );
      return data;
    },
    onSuccess: async (_, variables) => {
      await queryClient.refetchQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({
        queryKey: ["purchase-order", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
