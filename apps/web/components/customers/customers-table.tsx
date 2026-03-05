"use client";

import React from "react";
import {
  Loader2,
  Users,
  Phone,
  Mail,
  FileText,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Customer } from "@/hooks/use-customers";
import {
  Empty,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

interface CustomersTableProps {
  customers: Customer[];
  isLoading: boolean;
  isFetching: boolean;
  onEdit: (customer: Customer) => void;
  onViewLedger: (customer: Customer) => void;
}

export const CustomersTable = ({
  customers,
  isLoading,
  isFetching,
  onEdit,
  onViewLedger,
}: CustomersTableProps) => {
  return (
    <div className="bg-white rounded-2xl border-none shadow-xl shadow-slate-200/50 overflow-hidden relative">
      {isFetching && !isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Customer Name
              </th>
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Contact Info
              </th>
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Joined Date
              </th>
              <th className="text-right px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-slate-100 rounded animate-pulse w-32" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-slate-100 rounded animate-pulse w-48" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-slate-100 rounded animate-pulse w-24" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-slate-100 rounded animate-pulse w-24 ml-auto" />
                  </td>
                </tr>
              ))
            ) : customers.length === 0 ? (
              <tr className="border-b-0 hover:bg-transparent cursor-default">
                <td colSpan={4} className="px-6 py-12">
                  <Empty>
                    <EmptyMedia>
                      <Users className="w-6 h-6 text-slate-400" />
                    </EmptyMedia>
                    <EmptyTitle>No customers found</EmptyTitle>
                    <EmptyDescription>
                      Add a new customer to get started.
                    </EmptyDescription>
                  </Empty>
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <span
                        className="font-bold text-slate-900 group-hover:text-primary transition-colors cursor-pointer"
                        onClick={() => onEdit(customer)}
                      >
                        {customer.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1.5">
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />{" "}
                          {customer.phone}
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />{" "}
                          {customer.email}
                        </div>
                      )}
                      {!customer.phone && !customer.email && (
                        <span className="text-xs text-slate-400 italic font-semibold">
                          No contact info
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-500">
                    {new Date(customer.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs font-bold text-slate-600 bg-white shadow-sm border-slate-200"
                        onClick={() => onViewLedger(customer)}
                      >
                        <FileText className="w-3.5 h-3.5 mr-1.5 text-slate-400" />{" "}
                        Ledger
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-full"
                        onClick={() => onEdit(customer)}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
