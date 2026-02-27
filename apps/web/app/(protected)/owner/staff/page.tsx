"use client";

import React, { useState } from "react";
import {
  useStaff,
  useDeactivateStaff,
  usePendingInvites,
  useRevokeInvite,
} from "@/hooks/use-staff";
import { User, StaffInvite } from "@/types/staff";
import { Search, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { StaffTable } from "@/components/staff/staff-table";
import { StaffEditor } from "@/components/staff/staff-editor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function StaffPage() {
  const { data: staff, isLoading } = useStaff();
  const { data: pendingInvites, isLoading: isInvitesLoading } =
    usePendingInvites();
  const deactivateMutation = useDeactivateStaff();
  const revokeMutation = useRevokeInvite();

  const [search, setSearch] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [inviteToRevoke, setInviteToRevoke] = useState<StaffInvite | null>(
    null,
  );
  const [memberToDeactivate, setMemberToDeactivate] = useState<User | null>(
    null,
  );

  const filteredStaff = staff?.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredInvites = pendingInvites?.filter((i) =>
    i.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAddStaff = () => {
    setSelectedMember(null);
    setIsEditorOpen(true);
  };

  const handleEditStaff = (user: User) => {
    setSelectedMember(user);
    setIsEditorOpen(true);
  };

  const handleDeactivate = (user: User) => {
    setMemberToDeactivate(user);
  };

  const confirmDeactivate = async () => {
    if (!memberToDeactivate) return;
    try {
      await deactivateMutation.mutateAsync(memberToDeactivate.id);
      toast.success("Staff member deactivated");
      setMemberToDeactivate(null);
    } catch {
      toast.error("Failed to deactivate staff member");
    }
  };

  const handleRevokeInvite = (invite: StaffInvite) => {
    setInviteToRevoke(invite);
  };

  const confirmRevokeInvite = async () => {
    if (!inviteToRevoke) return;
    try {
      await revokeMutation.mutateAsync(inviteToRevoke.token);
      toast.success("Invite revoked successfully");
      setInviteToRevoke(null);
    } catch {
      toast.error("Failed to revoke invite");
    }
  };

  const handleCopyInviteUrl = (invite: StaffInvite) => {
    const url = `${window.location.origin}/invite/${invite.token}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied to clipboard");
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
          {(filteredStaff?.length || 0) + (filteredInvites?.length || 0)} Total
        </div>
      </div>

      {/* Table Section */}
      <StaffTable
        staff={filteredStaff}
        pendingInvites={filteredInvites}
        isLoading={isLoading || isInvitesLoading}
        onEdit={handleEditStaff}
        onDeactivate={handleDeactivate}
        onRevokeInvite={handleRevokeInvite}
        onCopyInviteUrl={handleCopyInviteUrl}
      />

      {/* Editor Slide-over */}
      <StaffEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        member={selectedMember}
      />

      {/* Revoke Invite Dialog */}
      <Dialog
        open={!!inviteToRevoke}
        onOpenChange={(open) => !open && setInviteToRevoke(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Invite</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke the invite for{" "}
              <span className="font-bold text-slate-900">
                {inviteToRevoke?.email}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInviteToRevoke(null)}
              disabled={revokeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRevokeInvite}
              disabled={revokeMutation.isPending}
            >
              {revokeMutation.isPending ? "Revoking..." : "Revoke Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Member Dialog */}
      <Dialog
        open={!!memberToDeactivate}
        onOpenChange={(open) => !open && setMemberToDeactivate(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Staff Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate{" "}
              <span className="font-bold text-slate-900">
                {memberToDeactivate?.name}
              </span>
              ? They will no longer be able to access the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMemberToDeactivate(null)}
              disabled={deactivateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeactivate}
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending ? "Deactivating..." : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
