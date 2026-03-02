"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { Business, UpdateBusinessPayload } from "@/types/business";

export function useBusiness() {
  return useQuery({
    queryKey: ["business", "me"],
    queryFn: async () => {
      const { data } = await apiClient.get<Business>("/business/me");
      return data;
    },
  });
}

export function useUpdateBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateBusinessPayload) => {
      const { data } = await apiClient.patch<Business>("/business/me", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business", "me"] });
    },
  });
}

export function useUploadBusinessLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await apiClient.patch<{ url: string }>(
        `/business/me/logo`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business", "me"] });
    },
  });
}
