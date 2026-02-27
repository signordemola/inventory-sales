"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Supplier } from "@/types/suppliers";
import { useSupplierBalance, useSupplier } from "@/hooks/use-suppliers";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Mail, MapPin, Phone, Wallet, Plus } from "lucide-react";
import { RecordPaymentModal } from "./record-payment-modal";

interface SupplierDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId: string | null;
}

export function SupplierDetailsSheet({
  isOpen,
  onClose,
  supplierId,
}: SupplierDetailsSheetProps) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const { data: supplier, isLoading: isSupplierLoading } = useSupplier(
    supplierId || "",
  );
  const { data: balance, isLoading: isBalanceLoading } = useSupplierBalance(
    supplierId || "",
  );

  if (!isOpen || !supplierId) return null;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle>Supplier Details</SheetTitle>
          </SheetHeader>

          {isSupplierLoading ? (
            <div className="space-y-4 py-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : supplier ? (
            <div className="py-6 space-y-8">
              {/* Profile Header */}
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {supplier.name}
                </h2>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 mt-1">
                  <span>
                    Joined {format(new Date(supplier.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
              </div>

              {/* Contact Card */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Contact Info
                </h3>
                {supplier.email && (
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <Mail className="size-4 text-primary" />
                    {supplier.email}
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <Phone className="size-4 text-primary" />
                    {supplier.phone}
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-start gap-3 text-sm font-medium text-slate-700">
                    <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                    {supplier.address}
                  </div>
                )}
              </div>

              {/* Ledger / Balance Card */}
              <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-50 border-b p-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Wallet className="size-4 text-primary" />
                    Account Ledger
                  </h3>
                  <Button
                    variant="default"
                    size="sm"
                    className="h-8"
                    onClick={() => setIsPaymentModalOpen(true)}
                  >
                    <Plus className="size-3 mr-1" /> Payment
                  </Button>
                </div>
                <div className="p-4 space-y-4">
                  {isBalanceLoading || !balance ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm font-medium text-slate-500">
                          Total Purchase Value
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          ₦{balance.totalOwed.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b pb-3">
                        <span className="text-sm font-medium text-slate-500">
                          Total Paid
                        </span>
                        <span className="text-sm font-bold text-emerald-600">
                          ₦{balance.totalPaid.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-sm font-bold uppercase text-slate-900">
                          Outstanding Balance
                        </span>
                        <span className="text-xl font-black text-rose-600">
                          ₦{balance.balance.toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-sm font-medium text-slate-500">
              Supplier not found.
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Payment Modal */}
      {supplier && balance && (
        <RecordPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          supplier={supplier}
          balance={balance}
        />
      )}
    </>
  );
}
