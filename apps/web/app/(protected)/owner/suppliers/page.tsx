"use client";

import React from "react";
import { useSuppliers } from "@/hooks/use-suppliers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, Search, Mail, Phone } from "lucide-react";

const SuppliersPage = () => {
  const { data: suppliers, isLoading } = useSuppliers();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight text-center sm:text-left">
            Suppliers & Procurement
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1 text-center sm:text-left">
            Manage vendor relations and purchase history.
          </p>
        </div>
        <button className="bg-primary text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto">
          <Plus className="size-5" />
          Add Supplier
        </button>
      </div>

      <Card className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <CardHeader className="border-b border-gray-50 bg-gray-50/30 flex flex-col sm:flex-row items-center justify-between gap-4 space-y-0 py-4">
          <CardTitle className="text-sm font-bold text-foreground tracking-tight uppercase flex items-center gap-2">
            <Users className="size-4 text-primary" />
            Vendor Directory
          </CardTitle>
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search suppliers..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border bg-slate-50/50">
                  <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                    Vendor Name
                  </TableHead>
                  <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                    Contact Info
                  </TableHead>
                  <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                    Address
                  </TableHead>
                  <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-40" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-48" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-60" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-4 w-20 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                ) : suppliers?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-32 text-center text-sm font-bold text-muted-foreground uppercase tracking-widest italic pt-12"
                    >
                      No suppliers registered
                    </TableCell>
                  </TableRow>
                ) : (
                  suppliers?.map((supplier) => (
                    <TableRow
                      key={supplier.id}
                      className="cursor-pointer hover:bg-slate-50/50 border-b border-border/50 group transition-colors"
                    >
                      <TableCell className="font-bold text-slate-900">
                        {supplier.name}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {supplier.email && (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                              <Mail className="size-3 text-primary/70" />
                              {supplier.email.toLowerCase()}
                            </div>
                          )}
                          {supplier.phone && (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                              <Phone className="size-3 text-primary/70" />
                              {supplier.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-500 max-w-[200px] truncate italic">
                        {supplier.address || "No address provided"}
                      </TableCell>
                      <TableCell className="text-right">
                        <button className="text-[10px] font-black text-primary hover:underline">
                          VIEW DETAILS
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuppliersPage;
