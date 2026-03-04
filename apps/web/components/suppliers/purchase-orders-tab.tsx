import React from "react";
import { format } from "date-fns";
import { PurchaseOrder } from "@/types/suppliers";
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
import { Search, PackagePlus, Eye, PackageCheck } from "lucide-react";

export function PurchaseOrdersTab({
  pos,
  isLoading,
  onCreatePO,
  onReceivePO,
}: {
  pos?: PurchaseOrder[];
  isLoading: boolean;
  onCreatePO: () => void;
  onReceivePO: (po: PurchaseOrder) => void;
}) {
  return (
    <Card className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <CardHeader className="border-b bg-gray-50/30 flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search orders..."
            className="w-full pl-9 pr-4 h-10 rounded-lg border bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <button
          onClick={onCreatePO}
          className="h-10 px-4 rounded-lg font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all text-sm flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <PackagePlus className="size-4" /> Create PO
        </button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-slate-50/50">
              <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                Ref & Date
              </TableHead>
              <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                Supplier
              </TableHead>
              <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider text-right">
                Total
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
                  <TableRow key={`po-skel-${i}`}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
            ) : pos?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-sm font-bold text-muted-foreground uppercase tracking-widest italic pt-12"
                >
                  No purchase orders found
                </TableCell>
              </TableRow>
            ) : (
              pos?.map((po) => (
                <TableRow key={po.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <p className="font-bold text-slate-900">{po.reference}</p>
                    <p className="text-xs font-semibold text-slate-400">
                      {format(new Date(po.createdAt), "MMM d, yyyy")}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-bold text-slate-700">
                      {po.supplier?.name}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                        po.status === "RECEIVED"
                          ? "bg-emerald-100 text-emerald-700"
                          : po.status === "PARTIAL"
                            ? "bg-blue-100 text-blue-700"
                            : po.status === "CANCELLED"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {po.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-black text-slate-900">
                    ₦{parseFloat(po.total).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {po.status !== "RECEIVED" && po.status !== "CANCELLED" && (
                      <button
                        onClick={() => onReceivePO(po)}
                        className="inline-flex items-center justify-center p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors"
                        title="Receive Stock"
                      >
                        <PackageCheck className="size-4" />
                      </button>
                    )}
                    <button
                      className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                      title="View Order"
                    >
                      <Eye className="size-4" />
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
