"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { UserRole } from "@/types/staff";

export interface InviteDetails {
  email: string;
  role: UserRole;
  business: { name: string };
  businessId: string;
  token: string;
}

export function useInviteDetails(token: string) {
  return useQuery({
    queryKey: ["invite", token],
    queryFn: async () => {
      const { data } = await apiClient.get<InviteDetails>(
        `/public-invites/${token}`,
      );
      return data;
    },
    retry: false,
  });
}

export function useAcceptInvite() {
  return useMutation({
    mutationFn: async ({
      token,
      payload,
    }: {
      token: string;
      payload: { name: string; password: string };
    }) => {
      const { data } = await apiClient.post(
        `/public-invites/${token}/accept`,
        payload,
      );
      return data;
    },
  });
}
