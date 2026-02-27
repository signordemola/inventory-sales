"use client";

import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import Logo from "../logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { footerItems, menuItems, UserRole } from "@/types";
import LogoutButton from "../auth/logout-btn";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useSessionContext } from "@/lib/session-context";

const DashboardSidebar = (props: React.ComponentProps<typeof Sidebar>) => {
  const pathname = usePathname();
  const { user } = useSessionContext();

  const role: keyof typeof UserRole =
    (user.role as keyof typeof UserRole) ?? "CASHIER";

  const filteredMenuItems = menuItems.filter(
    (item) => !item.roles || item.roles.includes(role),
  );
  const filteredFooterItems = footerItems.filter(
    (item) => !item.roles || item.roles.includes(role),
  );

  return (
    <Sidebar
      collapsible="offcanvas"
      className="lg:border-r-0! p-0 bg-white/80 backdrop-blur-xl dark:bg-slate-950/80"
      {...props}
    >
      <SidebarHeader className="flex items-center py-3 border-b border-slate-100 dark:border-slate-800">
        <Link href="/dashboard">
          <Logo />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3.5 py-4">
        <SidebarGroup className="p-0">
          <SidebarHeader className="px-4 pb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Main Menu
            </p>
          </SidebarHeader>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 flex flex-col gap-1">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href === "/dashboard" && pathname === "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"}`}
                    />
                    <span className="font-semibold text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="px-4 my-6">
          <SidebarSeparator className="bg-slate-100 dark:bg-slate-800" />
        </div>

        <SidebarGroup className="p-0">
          <SidebarHeader className="px-4 pb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              General
            </p>
          </SidebarHeader>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 flex flex-col gap-1">
              {filteredFooterItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"}`}
                    />
                    <span className="font-semibold text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 p-2.5 border border-slate-100 dark:border-slate-800">
          <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800 shadow-sm">
            <AvatarImage src={user.image ?? ""} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {user.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 text-slate-900 dark:text-white">
            <span className="truncate text-sm font-bold">{user.name}</span>
            <span className="truncate text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-tight">
              {role}
            </span>
          </div>
        </div>
        <div className="mt-2 text-primary">
          <LogoutButton />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
