import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { SalesResponse } from "@/types/sales";

export const useRecentSales = (limit: number = 5) => {
  return useQuery({
    queryKey: ["sales", "recent", limit],
    queryFn: async () => {
      const { data } = await apiClient.get<SalesResponse>("/sales", {
        params: { limit, page: 1 },
      });
      return data.items;
    },
    refetchInterval: 60000, // Refetch every minute
  });
};
