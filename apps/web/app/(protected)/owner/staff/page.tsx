"use client";

import React from "react";
import { useStaff } from "@/hooks/use-staff";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Search, ShieldCheck, Mail } from "lucide-react";

const StaffPage = () => {
  const { data: staff, isLoading } = useStaff();

  const getRoleColor = (role: string) => {
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

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight text-center sm:text-left">
            Staff & Access Control
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1 text-center sm:text-left">
            Manage team members and their relative permissions.
          </p>
        </div>
        <button className="bg-primary text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto">
          <UserPlus className="size-5" />
          Add Staff Member
        </button>
      </div>

      <Card className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <CardHeader className="border-b border-gray-50 bg-gray-50/30 flex flex-col sm:flex-row items-center justify-between gap-4 space-y-0 py-4">
          <CardTitle className="text-sm font-bold text-foreground tracking-tight uppercase flex items-center gap-2">
            <Users className="size-4 text-primary" />
            Active Team
          </CardTitle>
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search team members..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border bg-slate-50/50">
                  <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                    Member
                  </TableHead>
                  <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                    Role
                  </TableHead>
                  <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider text-center">
                    Status
                  </TableHead>
                  <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-40" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="h-4 w-20 mx-auto" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-4 w-24 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                ) : staff?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-32 text-center text-sm font-bold text-muted-foreground uppercase tracking-widest italic pt-12"
                    >
                      No staff members found
                    </TableCell>
                  </TableRow>
                ) : (
                  staff?.map((member) => (
                    <TableRow
                      key={member.id}
                      className="cursor-pointer hover:bg-slate-50/50 border-b border-border/50 group transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs ring-2 ring-white overflow-hidden shadow-sm">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm leading-tight">
                              {member.name}
                            </p>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold mt-0.5">
                              <Mail className="size-2.5" />
                              {member.email.toLowerCase()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`rounded-xl px-2 py-0.5 text-[10px] font-black border uppercase ${getRoleColor(member.role)} shadow-none`}
                        >
                          <ShieldCheck className="size-3 mr-1 inline" />
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div
                            className={`size-1.5 rounded-full ${member.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}
                          />
                          <span
                            className={`text-[10px] font-black uppercase ${member.isActive ? "text-emerald-600" : "text-slate-400"}`}
                          >
                            {member.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-black text-primary text-[10px] hover:underline cursor-pointer tracking-widest">
                        MANAGE ACCESS
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffPage;
