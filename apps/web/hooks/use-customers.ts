"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";

export interface CreditRepayment {
  id: string;
  creditSaleId: string;
  amount: string | number;
  notes: string | null;
  createdAt: string;
}

export interface CreditSale {
  id: string;
  saleId: string;
  customerId: string;
  totalAmount: string | number;
  amountPaid: string | number;
  balance: string | number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  repayments?: CreditRepayment[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  businessId: string;
  createdAt: string;
  updatedAt: string;
  creditSales?: CreditSale[];
}

export interface CreateCustomerPayload {
  name: string;
  phone?: string;
  email?: string;
}

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>;

export function useCustomers() {
  return useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data } = await apiClient.get<Customer[]>("/customers");
      return data;
    },
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery<Customer>({
    queryKey: ["customers", id],
    queryFn: async () => {
      if (!id) throw new Error("ID required");
      const { data } = await apiClient.get<Customer>(`/customers/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateCustomerPayload) => {
      const { data } = await apiClient.post<Customer>("/customers", payload);
      return data;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateCustomer(id: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateCustomerPayload) => {
      if (!id) throw new Error("ID required");
      const { data } = await apiClient.patch<Customer>(
        `/customers/${id}`,
        payload,
      );
      return data;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["customers"] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/customers/${id}`);
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["customers"] });
    },
  });
}

// Credit Ledger Hooks

export interface CreateRepaymentPayload {
  creditSaleId: string;
  amount: number;
  notes?: string;
}

export function useCreateRepayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateRepaymentPayload) => {
      const { data } = await apiClient.post<CreditRepayment>(
        "/customers/repayments",
        payload,
      );
      return data;
    },
    onSuccess: async () => {
      // Refresh customer list so credit balances update immediately
      await queryClient.refetchQueries({ queryKey: ["customers"] });
    },
  });
}
