"use client";

import React, { useState } from "react";
import { useStaff, useDeactivateStaff } from "@/hooks/use-staff";
import { User } from "@/types/staff";
import { Search, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { StaffTable } from "@/components/staff/staff-table";
import { StaffEditor } from "@/components/staff/staff-editor";

export default function StaffPage() {
  const { data: staff, isLoading } = useStaff();
  const deactivateMutation = useDeactivateStaff();

  const [search, setSearch] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  const filteredStaff = staff?.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAddStaff = () => {
    setSelectedMember(null);
    setIsEditorOpen(true);
  };

  const handleEditStaff = (user: User) => {
    setSelectedMember(user);
    setIsEditorOpen(true);
  };

  const handleDeactivate = async (user: User) => {
    if (confirm(`Are you sure you want to deactivate ${user.name}?`)) {
      try {
        await deactivateMutation.mutateAsync(user.id);
        toast.success("Staff member deactivated");
      } catch {
        toast.error("Failed to deactivate staff member");
      }
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50/30 p-6 md:p-10">
      {/* Header Section */}
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-primary/10 rounded-2xl">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">
                Human Resources
              </span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Staff & Access
            </h1>
            <p className="text-slate-500 font-semibold text-lg max-w-md">
              Manage your business team, set roles, and control system
              permissions.
            </p>
          </div>

          <Button
            onClick={handleAddStaff}
            className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold shadow-xl shadow-primary/20 transition-all active:scale-95 gap-3"
          >
            <UserPlus className="w-5 h-5" />
            Add Staff Member
          </Button>
        </div>

        {/* Toolbar Section */}
        <div className="bg-white/50 backdrop-blur-md p-2 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search by name or email..."
              className="w-full pl-14 h-14 bg-white border-none rounded-2xl text-lg font-medium shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20 transition-all placeholder:text-slate-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table Section */}
        <StaffTable
          staff={filteredStaff}
          isLoading={isLoading}
          onEdit={handleEditStaff}
          onDeactivate={handleDeactivate}
        />
      </div>

      {/* Editor Slide-over */}
      <StaffEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        member={selectedMember}
      />
    </div>
  );
}
