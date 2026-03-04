"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { User, UserRole, StaffInvite } from "@/types/staff";

export function useStaff() {
  return useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data } = await apiClient.get<User[]>("/users");
      return data;
    },
  });
}

interface InviteStaffPayload {
  email: string;
  role: UserRole;
}

export function useInviteStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: InviteStaffPayload) => {
      const { data } = await apiClient.post<{ inviteUrl: string }>(
        "/users/invite",
        payload,
      );
      return data;
    },
    onSuccess: () => {
      // we can still invalidate to show 'Pending' invites in the near future if we add them to the query
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

export function usePendingInvites() {
  return useQuery({
    queryKey: ["staff-invites"],
    queryFn: async () => {
      const { data } = await apiClient.get<StaffInvite[]>("/users/invites");
      return data;
    },
  });
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (token: string) => {
      await apiClient.delete(`/users/invites/${token}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-invites"] });
    },
  });
}
