import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { DashboardStats, DateFilterParams } from "@/types/analytics";

export const useDashboardStats = (filters: DateFilterParams = {}) => {
  return useQuery({
    queryKey: ["analytics", "dashboard", filters],
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardStats>(
        "/analytics/dashboard",
        {
          params: filters,
        },
      );
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
