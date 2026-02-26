"use client";

import { useState, useEffect } from "react";
import {
  Customer,
  useCreateCustomer,
  useUpdateCustomer,
} from "@/hooks/use-customers";
import { X, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { cn } from "@/lib/utils";

interface CustomerEditorProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
}

export const CustomerEditor = ({
  isOpen,
  onClose,
  customer,
}: CustomerEditorProps) => {
  const isCreating = !customer;
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer(customer?.id);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(customer?.name || "");
      setPhone(customer?.phone || "");
      setEmail(customer?.email || "");
    }
  }, [isOpen, customer]);

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Customer name is required.");

    const payload = {
      name,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
    };

    try {
      if (isCreating) {
        await createMutation.mutateAsync(payload);
        toast.success("Customer created successfully");
      } else if (customer) {
        await updateMutation.mutateAsync(payload);
        toast.success("Customer updated");
      }
      onClose();
    } catch (error) {
      const e = error as AxiosError<{ message: string }>;
      toast.error(e?.response?.data?.message || "Failed to save customer");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform border-l border-slate-100">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {isCreating ? "Add New Customer" : "Edit Customer"}
              </h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {isCreating ? "Create Profile" : customer?.id.slice(-8)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block">
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. Jane Doe"
              className="h-11 rounded-xl bg-slate-50 border-slate-200 font-medium"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block">
              Phone Number
            </label>
            <Input
              placeholder="e.g. 08012345678"
              className="h-11 rounded-xl bg-slate-50 border-slate-200 font-medium"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="e.g. jane@example.com"
              className="h-11 rounded-xl bg-slate-50 border-slate-200 font-medium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            className="h-11 px-6 rounded-xl font-bold bg-white"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="h-11 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-sm"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </>
  );
};
