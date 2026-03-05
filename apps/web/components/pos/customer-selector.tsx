"use client";

import React, { useState, useMemo } from "react";
import { UserPlus, User, Search, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCustomers, Customer } from "@/hooks/use-customers";

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
}

export function CustomerSelector({
  selectedCustomer,
  onSelectCustomer,
}: CustomerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: customers, isLoading } = useCustomers();

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    if (!searchQuery) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)),
    );
  }, [customers, searchQuery]);

  const handleSelect = (c: Customer | null) => {
    onSelectCustomer(c);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="w-full flex justify-between items-center h-12 px-2 pl-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all mb-3 group relative bg-white dark:bg-transparent">
        <DialogTrigger
          render={
            <button className="flex-1 flex justify-between items-center text-left outline-none h-full" />
          }
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center shrink-0">
              {selectedCustomer ? (
                <User className="w-4 h-4 text-primary" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Customer (Optional)
              </p>
              <p className="text-sm font-semibold text-slate-700 dark:text-white truncate">
                {selectedCustomer ? selectedCustomer.name : "Walk-in Customer"}
              </p>
            </div>
          </div>
          {!selectedCustomer && (
            <span className="text-[10px] font-bold text-slate-300 group-hover:text-primary transition-colors uppercase pr-2">
              Select
            </span>
          )}
        </DialogTrigger>

        {selectedCustomer && (
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 shrink-0 z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSelect(null);
            }}
          >
            <X className="w-4 h-4 text-slate-500" />
          </Button>
        )}
      </div>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Customer</DialogTitle>
        </DialogHeader>

        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, phone or email..."
            className="pl-9 h-11 bg-slate-50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <ScrollArea className="h-[300px] mt-4 border border-slate-100 rounded-lg">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-slate-500">
              Loading customers...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              No customers found.
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Walk-in Option */}
              <button
                className="flex items-center justify-between p-3 hover:bg-slate-50 border-b border-slate-50 text-left transition-colors"
                onClick={() => handleSelect(null)}
              >
                <div>
                  <p className="font-semibold text-sm text-slate-900">
                    Walk-in Customer
                  </p>
                  <p className="text-xs text-slate-500">No details tracked</p>
                </div>
                {!selectedCustomer && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>

              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 border-b border-slate-50 text-left transition-colors"
                  onClick={() => handleSelect(c)}
                >
                  <div>
                    <p className="font-semibold text-sm text-slate-900">
                      {c.name}
                    </p>
                    {c.phone && (
                      <p className="text-xs text-slate-500 font-mono">
                        {c.phone}
                      </p>
                    )}
                  </div>
                  {selectedCustomer?.id === c.id && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
