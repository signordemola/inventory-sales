"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";

export function useCreateSupplierPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: { amount: number; notes?: string };
    }) => {
      const { data } = await apiClient.post(
        `/suppliers/${id}/payments`,
        payload,
      );
      return data;
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier", variables.id] });
      await queryClient.refetchQueries({
        queryKey: ["supplier-balance", variables.id],
      });
    },
  });
}
