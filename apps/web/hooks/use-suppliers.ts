"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { Supplier, SupplierBalance } from "@/types/suppliers";

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data } = await apiClient.get<Supplier[]>("/suppliers");
      return data;
    },
  });
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: ["supplier", id],
    queryFn: async () => {
      const { data } = await apiClient.get<Supplier>(`/suppliers/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useSupplierBalance(id: string) {
  return useQuery({
    queryKey: ["supplier-balance", id],
    queryFn: async () => {
      const { data } = await apiClient.get<SupplierBalance>(
        `/suppliers/${id}/balance`,
      );
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<Supplier>) => {
      const { data } = await apiClient.post<Supplier>("/suppliers", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<Supplier>;
    }) => {
      const { data } = await apiClient.patch<Supplier>(
        `/suppliers/${id}`,
        payload,
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier", variables.id] });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}
