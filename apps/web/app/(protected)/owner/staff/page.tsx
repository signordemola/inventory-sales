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
    <div className="flex-1 space-y-8 p-10 h-full overflow-y-auto bg-slate-50/30">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-display">
            Staff & Access
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Manage your business team, set roles, and control system
            permissions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            className="h-11 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-sm transition-all active:scale-95"
            onClick={handleAddStaff}
          >
            <UserPlus className="w-4 h-4 mr-1.5" /> Add Staff Member
          </Button>
        </div>
      </div>

      {/* Toolbar Section */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search staff by name or email..."
            className="pl-10 h-12 rounded-xl bg-white border-slate-200 shadow-sm focus-visible:ring-primary/20 text-sm font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ml-auto text-sm font-bold text-slate-500 bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          {filteredStaff?.length || 0} Total Staff
        </div>
      </div>

      {/* Table Section */}
      <StaffTable
        staff={filteredStaff}
        isLoading={isLoading}
        onEdit={handleEditStaff}
        onDeactivate={handleDeactivate}
      />

      {/* Editor Slide-over */}
      <StaffEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        member={selectedMember}
      />
    </div>
  );
}
