"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TransactionUser {
  id: string;
  name: string;
}

export interface TransactionPayment {
  id: string;
  method: "CASH" | "CARD" | "TRANSFER" | "PAYSTACK" | "CREDIT";
  amount: number;
}

export interface TransactionItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  product: { id: string; name: string };
}

export interface Transaction {
  id: string;
  reference: string;
  subtotal: number;
  discount: number;
  total: number;
  status: "COMPLETED" | "VOID" | "RETURNED" | "PENDING";
  createdAt: string;
  cashier: TransactionUser | null;
  customer: TransactionUser | null;
  payments: TransactionPayment[];
  items: TransactionItem[];
}

interface PaginatedTransactions {
  items: Transaction[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface TransactionFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  cashierId?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTransactions(filters: TransactionFilters) {
  return useQuery<PaginatedTransactions>({
    queryKey: ["transactions", filters],
    queryFn: async () => {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(
          (entry) => entry[1] != null && entry[1] !== "",
        ),
      );

      const { data } = await apiClient.get<PaginatedTransactions>("/sales", {
        params: { page: 1, limit: 20, ...cleanFilters },
      });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}
