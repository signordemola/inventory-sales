"use client";

import { useState, useEffect } from "react";
import { User, UserRole } from "@/types/staff";
import { useInviteStaff, useUpdateStaffRole } from "@/hooks/use-staff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, ShieldCheck, UserPlus, X, CheckCircle2 } from "lucide-react";
import { AxiosError } from "axios";

interface StaffEditorProps {
  isOpen: boolean;
  onClose: () => void;
  member: User | null;
}

export function StaffEditor({ isOpen, onClose, member }: StaffEditorProps) {
  const isEditing = !!member;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("CASHIER");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const inviteMutation = useInviteStaff();
  const updateRoleMutation = useUpdateStaffRole();

  useEffect(() => {
    queueMicrotask(() => {
      if (member) {
        setName(member.name);
        setEmail(member.email);
        setRole(member.role);
        setInviteUrl(null);
      } else {
        setName("");
        setEmail("");
        setRole("CASHIER");
        setInviteUrl(null);
      }
    });
  }, [member, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      return toast.error("Email is required");
    }

    try {
      if (isEditing) {
        await updateRoleMutation.mutateAsync({ id: member.id, role });
        toast.success("Staff role updated successfully");
        onClose();
      } else {
        const result = await inviteMutation.mutateAsync({ email, role });
        setInviteUrl(result.inviteUrl);
        toast.success("Invite link generated successfully");
      }
    } catch (error) {
      const e = error as AxiosError<{ message: string }>;
      toast.error(
        e?.response?.data?.message ||
          `Failed to ${isEditing ? "update" : "invite"} staff member`,
      );
    }
  };

  const handleCopyLink = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      toast.success("Invite link copied to clipboard!");
    }
  };

  const isLoading = inviteMutation.isPending || updateRoleMutation.isPending;

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform border-l border-slate-100">
        <div className="p-6 flex items-center justify-between border-b border-slate-50 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${isEditing ? "bg-primary/10 text-primary" : "bg-emerald-100 text-emerald-600"}`}
            >
              {isEditing ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {isEditing ? "Manage Access" : "Invite Staff Member"}
              </h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {isEditing ? member.name : "Team Expansion"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-8 w-8 text-slate-400"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {inviteUrl ? (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900">
                Invite Ready!
              </h3>
              <p className="text-sm font-medium text-slate-500 max-w-[260px] mx-auto">
                Share this secure link with your new team member to complete
                their registration.
              </p>
            </div>
            <div className="w-full space-y-3 pt-4">
              <div className="relative">
                <Input
                  value={inviteUrl}
                  readOnly
                  className="pr-12 bg-slate-50/50 border-slate-200 text-slate-600 font-mono text-xs h-12 rounded-xl"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCopyLink}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <Button
                type="button"
                className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all"
                onClick={onClose}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSave}
            className="flex-1 p-6 space-y-6 overflow-y-auto"
          >
            <div className="space-y-4">
              {isEditing && (
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                    Full Name
                  </label>
                  <Input
                    placeholder="e.g. John Doe"
                    className="h-11 rounded-xl bg-slate-50 border-slate-100 font-medium focus:bg-white transition-all"
                    value={name}
                    readOnly
                    disabled
                  />
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold italic">
                    * Name cannot be changed here
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="name@business.com"
                  className="h-11 rounded-xl bg-slate-50 border-slate-100 font-medium focus:bg-white transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isEditing || isLoading}
                />
                {isEditing && (
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold italic">
                    * Email cannot be changed here
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                  System Role
                </label>
                <Select
                  value={role}
                  onValueChange={(val) => setRole(val as UserRole)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100 font-medium">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl w-full">
                    <SelectItem
                      value="CASHIER"
                      className="rounded-lg m-1 font-semibold"
                    >
                      Cashier (POS Only)
                    </SelectItem>
                    <SelectItem
                      value="MANAGER"
                      className="rounded-lg m-1 font-semibold"
                    >
                      Manager (Inventory & Staff)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-6 space-y-3">
              <Button
                type="submit"
                className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all"
                disabled={isLoading}
              >
                {isLoading
                  ? "Saving..."
                  : isEditing
                    ? "Save Changes"
                    : "Generate Invite Link"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
