"use client";

import React from "react";
import {
  Loader2,
  ReceiptText,
  Banknote,
  CreditCard,
  Building2,
  SmartphoneNfc,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Download,
  Ban,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { Transaction } from "@/hooks/use-transactions";
import { ReceiptTemplate } from "./receipt-template";
import { Printer } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

interface TransactionsTableProps {
  transactions: Transaction[];
  isLoading: boolean;
  isFetching: boolean;
  page: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onViewReceipt: (txn: Transaction) => void;
  isCashier: boolean;
  onVoidClick: (txn: Transaction) => void;
  onReturnClick: (txn: Transaction) => void;
}

function getPaymentIcon(method: string) {
  switch (method) {
    case "CASH":
      return <Banknote className="w-3.5 h-3.5" />;
    case "CARD":
      return <CreditCard className="w-3.5 h-3.5" />;
    case "TRANSFER":
      return <Building2 className="w-3.5 h-3.5" />;
    case "PAYSTACK":
      return <SmartphoneNfc className="w-3.5 h-3.5" />;
    default:
      return <ReceiptText className="w-3.5 h-3.5" />;
  }
}

function getPaymentLabel(method: string) {
  return method.charAt(0) + method.slice(1).toLowerCase();
}

export const TransactionsTable = ({
  transactions,
  isLoading,
  isFetching,
  page,
  totalItems,
  totalPages,
  onPageChange,
  onViewReceipt,
  isCashier,
  onVoidClick,
  onReturnClick,
}: TransactionsTableProps) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 dark:border-slate-800 shadow-none overflow-hidden relative">
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
                Reference
              </th>
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Time
              </th>
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Cashier
              </th>
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Payment
              </th>
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Total (₦)
              </th>
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Amount Paid
              </th>
              <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Status
              </th>
              <th className="text-right px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-slate-100 rounded animate-pulse w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : transactions.length === 0 ? (
              <tr className="border-b-0 hover:bg-transparent cursor-default">
                <td colSpan={8} className="px-6 py-12">
                  <Empty>
                    <EmptyMedia>
                      <ReceiptText className="w-6 h-6 text-slate-400" />
                    </EmptyMedia>
                    <EmptyTitle>No transactions found</EmptyTitle>
                    <EmptyDescription>
                      Try adjusting your filters.
                    </EmptyDescription>
                  </Empty>
                </td>
              </tr>
            ) : (
              transactions.map((txn) => {
                const date = new Date(txn.createdAt);
                const isVoid = txn.status === "VOID";
                const amountPaid = txn.payments.reduce(
                  (sum, p) => sum + Number(p.amount),
                  0,
                );

                const initials = txn.cashier?.name
                  ? txn.cashier.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "?";

                return (
                  <tr
                    key={txn.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                            isVoid
                              ? "bg-red-50 text-red-500"
                              : "bg-blue-50 text-blue-500",
                          )}
                        >
                          <ReceiptText className="w-4 h-4" />
                        </div>
                        <span
                          className={cn(
                            "font-bold",
                            isVoid
                              ? "text-slate-400 line-through"
                              : "text-slate-900",
                          )}
                        >
                          {txn.reference}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <p
                        className={cn(
                          "font-semibold text-sm",
                          isVoid ? "text-slate-400" : "text-slate-700",
                        )}
                      >
                        {date.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={cn(
                          "flex items-center gap-2",
                          isVoid && "opacity-50",
                        )}
                      >
                        <div className="w-6 h-6 rounded-full bg-[#fca5a5] flex items-center justify-center text-[9px] font-black text-white shrink-0">
                          {initials}
                        </div>
                        <span className="font-semibold text-slate-700 text-sm">
                          {txn.cashier?.name ?? "System"}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {txn.payments.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {txn.payments.map((pmt, idx) => (
                            <div key={idx} className="flex flex-col gap-0.5">
                              <div
                                className={cn(
                                  "inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border",
                                  pmt.method === "CASH"
                                    ? "bg-slate-50 text-slate-600 border-slate-200"
                                    : "bg-indigo-50 text-indigo-700 border-indigo-200",
                                  isVoid && "opacity-50",
                                )}
                              >
                                {getPaymentIcon(pmt.method)}
                                {getPaymentLabel(pmt.method)}
                                {txn.payments.length > 1 && (
                                  <span className="text-[10px] opacity-70 ml-0.5">
                                    {formatCurrency(pmt.amount)}
                                  </span>
                                )}
                              </div>
                              {pmt.reference && (
                                <span
                                  className="text-[10px] text-slate-400 font-semibold tracking-wide truncate max-w-[150px]"
                                  title={pmt.reference}
                                >
                                  Ref: {pmt.reference}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={cn(
                          "font-black text-[15px]",
                          isVoid
                            ? "text-slate-400 line-through"
                            : "text-slate-900",
                        )}
                      >
                        {formatCurrency(txn.total)}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={cn(
                          "font-bold text-sm",
                          isVoid
                            ? "text-slate-400 line-through"
                            : "text-slate-700",
                        )}
                      >
                        {formatCurrency(amountPaid)}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          txn.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-600"
                            : txn.status === "VOID"
                              ? "bg-red-50 text-red-600"
                              : "bg-amber-50 text-amber-600",
                        )}
                      >
                        <div
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            txn.status === "COMPLETED"
                              ? "bg-emerald-500"
                              : txn.status === "VOID"
                                ? "bg-red-500"
                                : "bg-amber-500",
                          )}
                        />
                        {txn.status}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
                          <MoreHorizontal className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          side="bottom"
                          className="w-48"
                        >
                          <DropdownMenuItem
                            onClick={() => onViewReceipt(txn)}
                            className="cursor-pointer gap-2"
                          >
                            <ReceiptText className="w-4 h-4" />
                            View Receipt
                          </DropdownMenuItem>

                          {!isCashier && (
                            <>
                              <DropdownMenuSeparator />
                              {isVoid ? (
                                <DropdownMenuItem
                                  disabled
                                  className="gap-2 opacity-40"
                                >
                                  <Ban className="w-4 h-4" />
                                  Voided
                                </DropdownMenuItem>
                              ) : txn.status === "COMPLETED" ? (
                                <DropdownMenuItem
                                  onClick={() => onVoidClick(txn)}
                                  variant="destructive"
                                  className="cursor-pointer gap-2"
                                >
                                  <Ban className="w-4 h-4" />
                                  Void Sale
                                </DropdownMenuItem>
                              ) : txn.status === "PARTIALLY_RETURNED" ? (
                                <DropdownMenuItem
                                  onClick={() => onReturnClick(txn)}
                                  className="cursor-pointer gap-2 text-amber-600"
                                >
                                  <RefreshCcw className="w-4 h-4" />
                                  Return More
                                </DropdownMenuItem>
                              ) : txn.status === "RETURNED" ? (
                                <DropdownMenuItem
                                  disabled
                                  className="gap-2 opacity-40"
                                >
                                  <RefreshCcw className="w-4 h-4" />
                                  Fully Returned
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => onReturnClick(txn)}
                                  className="cursor-pointer gap-2"
                                >
                                  <RefreshCcw className="w-4 h-4" />
                                  Process Return
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-500">
            Showing{" "}
            <span className="text-slate-900 font-bold">
              {(page - 1) * 20 + 1}
            </span>{" "}
            to{" "}
            <span className="text-slate-900 font-bold">
              {Math.min(page * 20, totalItems)}
            </span>{" "}
            of <span className="text-slate-900 font-bold">{totalItems}</span>{" "}
            results
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-lg border-slate-200"
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500 text-white font-bold text-sm">
              {page}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-lg border-slate-200"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
