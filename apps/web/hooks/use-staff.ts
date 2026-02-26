"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { User, UserRole } from "@/types/staff";

export function useStaff() {
  return useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data } = await apiClient.get<User[]>("/users");
      return data;
    },
  });
}

export interface CreateStaffPayload {
  email: string;
  name: string;
  role: UserRole;
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateStaffPayload) => {
      const { data } = await apiClient.post<User>("/users", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useUpdateStaffRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: UserRole }) => {
      const { data } = await apiClient.patch<User>(`/users/${id}/role`, {
        role,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useDeactivateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}
