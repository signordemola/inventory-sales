"use client";

import React, { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Printer } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

export type ZReportData = {
  shiftId: string;
  openedAt: string;
  closedAt: string | null;
  startingCash: number;
  totalRevenue: number;
  transactionCount: number;
  voidsCount?: number;
  returnsCount?: number;
  salesByMethod: Record<string, number>;
  totalPaidIn: number;
  totalPaidOut: number;
  expectedCash: number;
  actualCash: number | null;
  variance: number | null;
};

interface ZReportModalProps {
  isOpen: boolean;
  zReport: ZReportData | null;
  onDismiss: () => void;
  title?: string;
}

export function ZReportModal({
  isOpen,
  zReport,
  onDismiss,
  title = "Shift Closed — Z-Report",
}: ZReportModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  if (!zReport) return null;

  const varianceVal = zReport.variance ?? 0;
  const methodLabels: Record<string, string> = {
    CASH: "Cash",
    CARD: "Card",
    TRANSFER: "Transfer",
    PAYSTACK: "Paystack",
    CREDIT: "Credit",
  };

  const handlePrint = () => {
    // A simple print trigger. The actual styling relies on CSS @media print
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onDismiss()}>
      {/* 
        We use print-specific classes here. 
        When printing, the dialog overlay and fixed positioning should often be overridden,
        but for a quick implementation, we will append a global print stylesheet or rely on generic utilities.
        We'll use standard tailwind print utilities where possible.
      */}
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-0">
        <div
          ref={contentRef}
          className="print:w-[80mm] print:mx-auto print:bg-white print:text-black print:font-mono"
        >
          <DialogHeader className="print:hidden">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 mb-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <DialogTitle className="text-center text-xl">{title}</DialogTitle>
            <DialogDescription className="text-center">
              Summary of the shift session
            </DialogDescription>
          </DialogHeader>

          {/* Receipt Header (Visible mainly on Print, but nice in UI too) */}
          <div className="hidden print:block text-center border-b border-black pb-4 mb-4">
            <h1 className="text-xl font-bold uppercase">Z-REPORT</h1>
            <p className="text-xs mt-1">
              Opened: {format(new Date(zReport.openedAt), "dd/MM/yyyy HH:mm")}
            </p>
            {zReport.closedAt && (
              <p className="text-xs">
                Closed: {format(new Date(zReport.closedAt), "dd/MM/yyyy HH:mm")}
              </p>
            )}
            <p className="text-xs mt-1">
              Shift ID: {zReport.shiftId.slice(-8)}
            </p>
          </div>

          <div className="space-y-4 mt-2 print:space-y-2 print:mt-0">
            <div className="grid grid-cols-2 gap-3 print:grid-cols-1 print:gap-1">
              <div className="rounded-lg bg-slate-50 border p-3 text-center print:border-none print:bg-transparent print:p-0 print:flex print:justify-between print:text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest print:text-black print:text-xs">
                  Total Revenue
                </p>
                <p className="text-xl font-black text-slate-900 print:text-sm print:font-normal">
                  {formatCurrency(zReport.totalRevenue)}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 border p-3 text-center print:border-none print:bg-transparent print:p-0 print:flex print:justify-between print:text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest print:text-black print:text-xs">
                  Transactions
                </p>
                <p className="text-xl font-black text-slate-900 print:text-sm print:font-normal">
                  {zReport.transactionCount}
                </p>
              </div>
            </div>

            {/* Voids & Returns */}
            {(zReport.voidsCount! > 0 || zReport.returnsCount! > 0) && (
              <div className="rounded-lg border p-3 print:border-none print:p-0 print:border-t print:border-dashed print:border-black print:pt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 print:text-black print:text-xs print:font-bold">
                  Exceptions
                </p>
                <div className="space-y-1.5 print:space-y-0.5">
                  <div className="flex justify-between text-sm print:text-xs">
                    <span className="text-slate-600 print:text-black">
                      Voids
                    </span>
                    <span className="font-bold text-slate-900 print:text-black print:font-normal">
                      {zReport.voidsCount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm print:text-xs">
                    <span className="text-slate-600 print:text-black">
                      Returns
                    </span>
                    <span className="font-bold text-slate-900 print:text-black print:font-normal">
                      {zReport.returnsCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {Object.keys(zReport.salesByMethod).length > 0 && (
              <div className="rounded-lg border p-3 print:border-none print:p-0 print:border-t print:border-dashed print:border-black print:pt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 print:text-black print:text-xs print:font-bold">
                  Sales by Payment Method
                </p>
                <div className="space-y-1.5 print:space-y-0.5">
                  {Object.entries(zReport.salesByMethod).map(
                    ([method, amount]) => (
                      <div
                        key={method}
                        className="flex justify-between text-sm print:text-xs"
                      >
                        <span className="text-slate-600 print:text-black">
                          {methodLabels[method] || method}
                        </span>
                        <span className="font-bold text-slate-900 print:font-normal print:text-black">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {(zReport.totalPaidIn > 0 || zReport.totalPaidOut > 0) && (
              <div className="rounded-lg border p-3 print:border-none print:p-0 print:border-t print:border-dashed print:border-black print:pt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 print:text-black print:text-xs print:font-bold">
                  Drawer Movements
                </p>
                <div className="space-y-1.5 print:space-y-0.5">
                  {zReport.totalPaidIn > 0 && (
                    <div className="flex justify-between text-sm print:text-xs">
                      <span className="text-emerald-600 print:text-black">
                        Cash In
                      </span>
                      <span className="font-bold text-emerald-700 print:font-normal print:text-black">
                        +{formatCurrency(zReport.totalPaidIn)}
                      </span>
                    </div>
                  )}
                  {zReport.totalPaidOut > 0 && (
                    <div className="flex justify-between text-sm print:text-xs">
                      <span className="text-red-600 print:text-black">
                        Cash Out
                      </span>
                      <span className="font-bold text-red-700 print:font-normal print:text-black">
                        −{formatCurrency(zReport.totalPaidOut)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-lg border p-3 space-y-1.5 print:border-none print:p-0 print:border-t print:border-black print:pt-2 print:space-y-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 print:text-black print:text-xs print:font-bold">
                Cash Reconciliation
              </p>
              <div className="flex justify-between text-sm print:text-xs">
                <span className="text-slate-500 print:text-black">
                  Starting Float
                </span>
                <span className="font-semibold print:font-normal print:text-black">
                  {formatCurrency(zReport.startingCash)}
                </span>
              </div>
              <div className="flex justify-between text-sm print:text-xs">
                <span className="text-slate-500 print:text-black">
                  Expected Cash
                </span>
                <span className="font-semibold print:font-normal print:text-black">
                  {formatCurrency(zReport.expectedCash)}
                </span>
              </div>
              {zReport.actualCash !== null && (
                <div className="flex justify-between text-sm print:text-xs">
                  <span className="text-slate-500 print:text-black">
                    Actual Cash
                  </span>
                  <span className="font-semibold print:font-normal print:text-black">
                    {formatCurrency(zReport.actualCash)}
                  </span>
                </div>
              )}
              {varianceVal !== 0 && (
                <div
                  className={`flex justify-between text-sm font-bold pt-1 border-t print:border-dashed print:border-black print:text-xs print:font-bold print:mt-1 ${
                    varianceVal < 0
                      ? "text-red-600 print:text-black"
                      : "text-emerald-600 print:text-black"
                  }`}
                >
                  <span>{varianceVal < 0 ? "Shortage" : "Overage"}</span>
                  <span>
                    {varianceVal < 0 ? "−" : "+"}
                    {formatCurrency(Math.abs(varianceVal))}
                  </span>
                </div>
              )}
              {varianceVal === 0 && (
                <div className="flex justify-between text-sm font-bold pt-1 border-t text-emerald-600 print:border-dashed print:border-black print:text-xs print:font-bold print:text-black print:mt-1">
                  <span>Variance</span>
                  <span>₦0.00</span>
                </div>
              )}
            </div>

            <div className="hidden print:block text-center border-t border-black pt-4 mt-6">
              <p className="text-xs font-bold uppercase">END OF Z-REPORT</p>
            </div>

            <div className="flex gap-2 pt-2 justify-end print:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                Print
              </Button>
              <Button
                size="sm"
                onClick={onDismiss}
                className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                Done
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
