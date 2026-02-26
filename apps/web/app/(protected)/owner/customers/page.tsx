"use client";

import React, { useState } from "react";
import { useCustomers, Customer } from "@/hooks/use-customers";
import { Users, Plus, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomersTable } from "@/components/customers/customers-table";
import { CustomerEditor } from "@/components/customers/customer-editor";
import { CustomerLedger } from "@/components/customers/customer-ledger";
import { toast } from "sonner";

export default function CustomersPage() {
  const { data: customers, isLoading, isFetching } = useCustomers();

  const [search, setSearch] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  // Simple local search filter
  const filteredCustomers =
    customers?.filter((c) => {
      if (!search) return true;
      const term = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(term) ||
        c.phone?.includes(term) ||
        c.email?.toLowerCase().includes(term)
      );
    }) || [];

  const handleCreateNew = () => {
    setSelectedCustomer(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditorOpen(true);
  };

  const handleViewLedger = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsLedgerOpen(true);
  };

  return (
    <div className="flex-1 space-y-8 p-10 h-full overflow-y-auto bg-slate-50/30">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-display">
            Customer Directory
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Manage customer profiles and historical credit ledgers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-11 px-5 rounded-xl font-bold bg-white text-slate-700 border-slate-200 shadow-sm hover:bg-slate-50"
          >
            <Download className="w-4 h-4 mr-2 text-slate-400" /> Export CSV
          </Button>
          <Button
            className="h-11 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-sm transition-all active:scale-95"
            onClick={handleCreateNew}
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Customer
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search customers by name, phone, or email..."
            className="pl-10 h-12 rounded-xl bg-white border-slate-200 shadow-sm focus-visible:ring-primary/20 text-sm font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ml-auto text-sm font-bold text-slate-500 bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          {filteredCustomers.length} Total Patients
        </div>
      </div>

      {/* Grid */}
      <CustomersTable
        customers={filteredCustomers}
        isLoading={isLoading}
        isFetching={isFetching}
        onEdit={handleEdit}
        onViewLedger={handleViewLedger}
      />

      {/* Editor Modal / Slide-over */}
      <CustomerEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        customer={selectedCustomer}
      />

      {/* Ledger Modal / Slide-over */}
      <CustomerLedger
        isOpen={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
        customer={selectedCustomer}
      />
    </div>
  );
}
