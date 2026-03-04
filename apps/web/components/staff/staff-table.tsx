"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Mail,
  MoreHorizontal,
  UserCog,
  UserMinus,
  Copy,
  UserPlus,
} from "lucide-react";
import { User, UserRole, StaffInvite } from "@/types/staff";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";

interface StaffTableProps {
  staff: User[] | undefined;
  pendingInvites?: StaffInvite[] | undefined;
  isLoading: boolean;
  onEdit: (user: User) => void;
  onDeactivate: (user: User) => void;
  onRevokeInvite?: (invite: StaffInvite) => void;
  onCopyInviteUrl?: (invite: StaffInvite) => void;
}

export function StaffTable({
  staff,
  pendingInvites,
  isLoading,
  onEdit,
  onDeactivate,
  onRevokeInvite,
  onCopyInviteUrl,
}: StaffTableProps) {
  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "OWNER":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "MANAGER":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "CASHIER":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <Skeleton
              key={`staff-skel-${i}`}
              className="h-16 w-full rounded-xl"
            />
          ))}
      </div>
    );
  }

  if (
    (!staff || staff.length === 0) &&
    (!pendingInvites || pendingInvites.length === 0)
  ) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          No staff members or pending invites found.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-slate-50 bg-slate-50/50">
            <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider py-4 pl-6">
              Member
            </TableHead>
            <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
              Role
            </TableHead>
            <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider text-center">
              Status
            </TableHead>
            <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider text-right pr-6">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {staff?.map((member) => (
            <TableRow
              key={member.id}
              className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors"
            >
              <TableCell className="py-4 pl-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm ring-4 ring-white shadow-sm overflow-hidden">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm leading-tight group-hover:text-primary transition-colors">
                      {member.name}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold mt-0.5">
                      <Mail className="size-2.5" />
                      {member.email.toLowerCase()}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  className={`rounded-xl px-2.5 py-0.5 text-[10px] font-black border uppercase ${getRoleColor(member.role)} shadow-none`}
                >
                  <ShieldCheck className="size-3 mr-1 inline" />
                  {member.role}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <div
                    className={`size-2 rounded-full ${member.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}
                  />
                  <span
                    className={`text-[10px] font-black uppercase ${member.isActive ? "text-emerald-600" : "text-slate-400"}`}
                  >
                    {member.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right pr-6">
                <DropdownMenu>
                  <DropdownMenuTrigger className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full inline-flex items-center justify-center transition-colors outline-none">
                    <MoreHorizontal className="h-4 w-4 text-slate-400" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 rounded-xl border-slate-100 shadow-xl"
                  >
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3">
                        Management
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        className="gap-2 text-sm font-semibold rounded-lg m-1 cursor-pointer"
                        onClick={() => onEdit(member)}
                      >
                        <UserCog className="w-4 h-4 text-slate-400" /> Manage
                        Access
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator className="bg-slate-50" />
                    <DropdownMenuItem
                      className="gap-2 text-sm font-semibold rounded-lg m-1 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                      onClick={() => onDeactivate(member)}
                    >
                      <UserMinus className="w-4 h-4" /> Deactivate
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {pendingInvites?.map((invite) => {
            const isExpired = new Date(invite.expiresAt) < new Date();
            return (
              <TableRow
                key={invite.id}
                className={`group border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors ${isExpired ? "bg-red-50/20" : "bg-orange-50/30"}`}
              >
                <TableCell className="py-4 pl-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm ring-4 ring-white shadow-sm overflow-hidden border border-dashed border-slate-300">
                      <UserPlus className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p
                        className={`font-bold text-sm leading-tight transition-colors italic ${isExpired ? "text-red-500" : "text-slate-900 group-hover:text-primary"}`}
                      >
                        {isExpired ? "Expired Invite" : "Pending Invite"}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold mt-0.5">
                        <Mail className="size-2.5" />
                        {invite.email.toLowerCase()}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={`rounded-xl px-2.5 py-0.5 text-[10px] font-black border uppercase ${getRoleColor(invite.role)} shadow-none`}
                  >
                    <ShieldCheck className="size-3 mr-1 inline" />
                    {invite.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div
                      className={`size-2 rounded-full ${isExpired ? "bg-red-500" : "bg-orange-400 animate-pulse"}`}
                    />
                    <span
                      className={`text-[10px] font-black uppercase ${isExpired ? "text-red-600" : "text-orange-600"}`}
                    >
                      {isExpired ? "Expired" : "Pending"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full inline-flex items-center justify-center transition-colors outline-none">
                      <MoreHorizontal className="h-4 w-4 text-slate-400" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 rounded-xl border-slate-100 shadow-xl"
                    >
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3">
                          Invite Management
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          className="gap-2 text-sm font-semibold rounded-lg m-1 cursor-pointer"
                          onClick={() => onCopyInviteUrl?.(invite)}
                        >
                          <Copy className="w-4 h-4 text-slate-400" /> Copy Link
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator className="bg-slate-50" />
                      <DropdownMenuItem
                        className="gap-2 text-sm font-semibold rounded-lg m-1 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                        onClick={() => onRevokeInvite?.(invite)}
                      >
                        <UserMinus className="w-4 h-4" /> Revoke Invite
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
