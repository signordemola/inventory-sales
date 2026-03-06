"use client";

import React, { useReducer } from "react";
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

type StaffState = {
  search: string;
  isEditorOpen: boolean;
  selectedMember: User | null;
  inviteToRevoke: StaffInvite | null;
  memberToDeactivate: User | null;
};

type StaffAction =
  | { type: "SET_SEARCH"; payload: string }
  | { type: "OPEN_EDITOR"; payload?: User | null }
  | { type: "CLOSE_EDITOR" }
  | { type: "SET_REVOKE_INVITE"; payload: StaffInvite | null }
  | { type: "SET_DEACTIVATE_MEMBER"; payload: User | null };

const initialState: StaffState = {
  search: "",
  isEditorOpen: false,
  selectedMember: null,
  inviteToRevoke: null,
  memberToDeactivate: null,
};

function staffReducer(state: StaffState, action: StaffAction): StaffState {
  switch (action.type) {
    case "SET_SEARCH":
      return { ...state, search: action.payload };
    case "OPEN_EDITOR":
      return {
        ...state,
        isEditorOpen: true,
        selectedMember: action.payload || null,
      };
    case "CLOSE_EDITOR":
      return { ...state, isEditorOpen: false, selectedMember: null };
    case "SET_REVOKE_INVITE":
      return { ...state, inviteToRevoke: action.payload };
    case "SET_DEACTIVATE_MEMBER":
      return { ...state, memberToDeactivate: action.payload };
    default:
      return state;
  }
}

export default function StaffPage() {
  const { data: staff, isLoading } = useStaff();
  const { data: pendingInvites, isLoading: isInvitesLoading } =
    usePendingInvites();
  const deactivateMutation = useDeactivateStaff();
  const revokeMutation = useRevokeInvite();

  const [state, dispatch] = useReducer(staffReducer, initialState);

  const filteredStaff = staff?.filter(
    (u) =>
      u.name.toLowerCase().includes(state.search.toLowerCase()) ||
      u.email.toLowerCase().includes(state.search.toLowerCase()),
  );

  const filteredInvites = pendingInvites?.filter((i) =>
    i.email.toLowerCase().includes(state.search.toLowerCase()),
  );

  const handleAddStaff = () => dispatch({ type: "OPEN_EDITOR" });
  const handleEditStaff = (user: User) =>
    dispatch({ type: "OPEN_EDITOR", payload: user });
  const handleDeactivate = (user: User) =>
    dispatch({ type: "SET_DEACTIVATE_MEMBER", payload: user });
  const handleRevokeInvite = (invite: StaffInvite) =>
    dispatch({ type: "SET_REVOKE_INVITE", payload: invite });

  const confirmDeactivate = async () => {
    if (!state.memberToDeactivate) return;
    try {
      await deactivateMutation.mutateAsync(state.memberToDeactivate.id);
      toast.success("Staff member deactivated");
      dispatch({ type: "SET_DEACTIVATE_MEMBER", payload: null });
    } catch {
      toast.error("Failed to deactivate staff member");
    }
  };

  const confirmRevokeInvite = async () => {
    if (!state.inviteToRevoke) return;
    try {
      await revokeMutation.mutateAsync(state.inviteToRevoke.token);
      toast.success("Invite revoked successfully");
      dispatch({ type: "SET_REVOKE_INVITE", payload: null });
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
    <div className="flex-1 space-y-8 p-6 md:p-10 h-full overflow-y-auto bg-white dark:bg-slate-950">
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

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search staff by name or email..."
            className="pl-10 h-11 rounded-xl bg-white border-slate-200 shadow-sm focus-visible:ring-primary/20 text-sm font-medium"
            value={state.search}
            onChange={(e) =>
              dispatch({ type: "SET_SEARCH", payload: e.target.value })
            }
          />
        </div>
        <div className="ml-auto text-sm font-bold text-slate-500 bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          {(filteredStaff?.length || 0) + (filteredInvites?.length || 0)} Total
        </div>
      </div>

      <StaffTable
        staff={filteredStaff}
        pendingInvites={filteredInvites}
        isLoading={isLoading || isInvitesLoading}
        onEdit={handleEditStaff}
        onDeactivate={handleDeactivate}
        onRevokeInvite={handleRevokeInvite}
        onCopyInviteUrl={handleCopyInviteUrl}
      />

      <StaffEditor
        isOpen={state.isEditorOpen}
        onClose={() => dispatch({ type: "CLOSE_EDITOR" })}
        member={state.selectedMember}
      />

      <Dialog
        open={!!state.inviteToRevoke}
        onOpenChange={(open) =>
          !open && dispatch({ type: "SET_REVOKE_INVITE", payload: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Invite</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke the invite for{" "}
              <span className="font-bold text-slate-900">
                {state.inviteToRevoke?.email}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                dispatch({ type: "SET_REVOKE_INVITE", payload: null })
              }
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

      <Dialog
        open={!!state.memberToDeactivate}
        onOpenChange={(open) =>
          !open && dispatch({ type: "SET_DEACTIVATE_MEMBER", payload: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Staff Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate{" "}
              <span className="font-bold text-slate-900">
                {state.memberToDeactivate?.name}
              </span>
              ? They will no longer be able to access the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                dispatch({ type: "SET_DEACTIVATE_MEMBER", payload: null })
              }
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
