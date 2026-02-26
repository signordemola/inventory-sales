"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { User } from "@/types/staff";

export function useStaff() {
  return useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data } = await apiClient.get<User[]>("/users");
      return data;
    },
  });
}
