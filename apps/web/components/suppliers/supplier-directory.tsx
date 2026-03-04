import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Mail, Phone } from "lucide-react";
import { Supplier } from "@/types/suppliers";

export function SupplierDirectory({
  suppliers,
  isLoading,
  onAddSupplier,
  onEditSupplier,
  onViewDetails,
}: {
  suppliers?: Supplier[];
  isLoading: boolean;
  onAddSupplier: () => void;
  onEditSupplier: (s: Supplier, e: React.MouseEvent) => void;
  onViewDetails: (id: string, e?: React.MouseEvent) => void;
}) {
  return (
    <Card className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <CardHeader className="border-b bg-gray-50/30 flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search suppliers..."
            className="w-full pl-9 pr-4 h-10 rounded-lg border bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <button
          onClick={onAddSupplier}
          className="h-10 px-4 rounded-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-sm transition-all text-sm flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          Add Supplier
        </button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-slate-50/50">
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
              Array(3)
                .fill(0)
                .map((_, i) => (
                  <TableRow key={`sup-skel-${i}`}>
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
                  className="cursor-pointer hover:bg-slate-50/50 group"
                  onClick={() => onViewDetails(supplier.id)}
                >
                  <TableCell className="font-bold text-slate-900">
                    {supplier.name}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {supplier.email && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <Mail className="size-3 text-primary/70" />{" "}
                          {supplier.email}
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <Phone className="size-3 text-primary/70" />{" "}
                          {supplier.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-500 truncate max-w-[200px]">
                    {supplier.address || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={(e) => onEditSupplier(supplier, e)}
                      className="text-[10px] font-black text-slate-400 hover:text-primary mr-4 transition-colors"
                    >
                      EDIT
                    </button>
                    <button className="text-[10px] font-black text-primary hover:underline">
                      DETAILS
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
