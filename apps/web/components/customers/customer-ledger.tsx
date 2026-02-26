"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Calculator,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  History,
  Plus,
} from "lucide-react";
import {
  Customer,
  CreditSale,
  useCreateRepayment,
} from "@/hooks/use-customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AxiosError } from "axios";

interface CustomerLedgerProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export const CustomerLedger = ({
  isOpen,
  onClose,
  customer,
}: CustomerLedgerProps) => {
  const [selectedSale, setSelectedSale] = useState<CreditSale | null>(null);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const repaymentMutation = useCreateRepayment();

  if (!isOpen || !customer) return null;

  const handleRepayment = async () => {
    if (!selectedSale) return;
    const paymentAmount = Number(amount);

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return toast.error("Please enter a valid amount");
    }

    if (paymentAmount > Number(selectedSale.balance)) {
      return toast.error(
        "Repayment amount cannot exceed the outstanding balance",
      );
    }

    try {
      await repaymentMutation.mutateAsync({
        creditSaleId: selectedSale.id,
        amount: paymentAmount,
        notes: notes || undefined,
      });
      toast.success("Repayment registered successfully");
      setAmount("");
      setNotes("");
      setSelectedSale(null); // Return to list view
    } catch (error) {
      const e = error as AxiosError<{ message: string }>;
      toast.error(e?.response?.data?.message || "Failed to process repayment");
    }
  };

  const totalOutstanding =
    customer.creditSales?.reduce(
      (acc, sale) => acc + Number(sale.balance),
      0,
    ) || 0;

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col transform transition-transform border-l border-slate-100">
        {/* Header */}
        <div className="px-6 py-4 flex flex-col justify-center border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                onClick={selectedSale ? () => setSelectedSale(null) : onClose}
              >
                {selectedSale ? (
                  <ChevronLeft className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </Button>
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Credit Ledger
                </h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {customer.name}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500">
                  Total Outstanding
                </p>
                <p className="text-xl font-black text-slate-900">
                  ₦{" "}
                  {totalOutstanding.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-500">Active Credits</p>
              <p className="text-lg font-bold text-slate-700">
                {customer.creditSales?.filter((s) => Number(s.balance) > 0)
                  .length || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {!selectedSale ? (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" /> Credit History
              </h3>

              {!customer.creditSales || customer.creditSales.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                  <p className="text-sm font-bold text-slate-500">
                    No credit history found.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customer.creditSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:border-primary/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedSale(sale)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">
                          {format(new Date(sale.createdAt), "MMM dd, yyyy")}
                        </span>
                        {Number(sale.balance) <= 0 ? (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 flex items-center gap-1 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3.5 h-3.5" /> CLEARED
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                            OUTSTANDING
                          </span>
                        )}
                      </div>
                      <div className="flex items-end justify-between mt-3">
                        <div>
                          <p className="text-xs font-semibold text-slate-500">
                            Total Purchase
                          </p>
                          <p className="text-sm font-bold text-slate-900">
                            ₦{" "}
                            {Number(sale.totalAmount).toLocaleString(
                              undefined,
                              { minimumFractionDigits: 2 },
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-slate-500">
                            Current Balance
                          </p>
                          <p
                            className={`text-lg font-black ${Number(sale.balance) > 0 ? "text-orange-600" : "text-emerald-600"}`}
                          >
                            ₦{" "}
                            {Number(sale.balance).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 mb-4 block">
                  Selected Credit Sale
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-500">Date</span>
                    <span className="font-bold text-slate-900">
                      {format(new Date(selectedSale.createdAt), "MMM dd, yyyy")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-500">
                      Total Amount
                    </span>
                    <span className="font-bold text-slate-900">
                      ₦ {Number(selectedSale.totalAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-3 mt-3">
                    <span className="font-semibold text-slate-500">
                      Remaining Balance
                    </span>
                    <span className="font-black text-orange-600 text-lg">
                      ₦{" "}
                      {Number(selectedSale.balance).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {Number(selectedSale.balance) > 0 && (
                <div className="space-y-4 pt-2">
                  <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" /> Record
                    Repayment
                  </h3>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                      Amount Received (₦)
                    </label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="h-12 rounded-xl bg-white border-slate-200 text-lg font-black"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                      Payment Notes{" "}
                      <span className="text-slate-400 font-normal">
                        (Optional)
                      </span>
                    </label>
                    <Input
                      placeholder="e.g. Bank Transfer"
                      className="h-11 rounded-xl bg-white border-slate-200 font-medium"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <Button
                    className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-sm mt-4"
                    disabled={repaymentMutation.isPending}
                    onClick={handleRepayment}
                  >
                    {repaymentMutation.isPending
                      ? "Processing..."
                      : "Process Payment"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
