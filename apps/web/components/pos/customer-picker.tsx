"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Search, User, AlertCircle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { db, LocalCustomer } from "@/lib/db";

interface CustomerPickerProps {
  onSelect: (customer: LocalCustomer) => void;
  onCancel: () => void;
}

export function CustomerPicker({ onSelect, onCancel }: CustomerPickerProps) {
  const [search, setSearch] = useState("");

  const customers = useLiveQuery(async (): Promise<LocalCustomer[]> => {
    const all = await db.customers.toArray();
    if (!search.trim()) return all.slice(0, 30);
    const q = search.toLowerCase();
    return all
      .filter((c) => c.name.toLowerCase().includes(q) || c.phone?.includes(q))
      .slice(0, 30);
  }, [search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          Select Customer for Credit
        </h4>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 rounded-xl border-slate-200 bg-slate-50 text-sm"
          autoFocus
        />
      </div>

      {/* Customer list */}
      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
        {customers === undefined ? (
          <p className="text-xs text-slate-400 text-center py-4">Loading...</p>
        ) : customers.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">
            {search ? "No customers found" : "No customers cached yet"}
          </p>
        ) : (
          customers.map((customer) => (
            <button
              key={customer.id}
              onClick={() => onSelect(customer)}
              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-white border border-slate-100 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors">
                  <User className="w-4 h-4 text-slate-500 group-hover:text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {customer.name}
                  </p>
                  {customer.phone && (
                    <p className="text-xs text-slate-400">{customer.phone}</p>
                  )}
                </div>
              </div>

              {customer.creditBalance > 0 && (
                <div className="flex items-center gap-1 shrink-0">
                  <AlertCircle className="w-3 h-3 text-amber-500" />
                  <span className="text-xs font-bold text-amber-600">
                    ₦{customer.creditBalance.toLocaleString()} owed
                  </span>
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
