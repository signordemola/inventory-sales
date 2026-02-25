"use client";

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
import { footerItems, menuItems } from "@/types";
import LogoutButton from "../auth/logout-btn";

const DashboardSidebar = (props: React.ComponentProps<typeof Sidebar>) => {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="offcanvas"
      className="lg:border-r-0! p-0 bg-white/80 backdrop-blur-xl"
      {...props}
    >
      <SidebarHeader className="flex items-center py-4.5 border-b ">
        <Link href={`/`}>
          <Logo />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3.5 py-4">
        <SidebarHeader>
          <p className="text-sm">Menu</p>
        </SidebarHeader>

        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="px-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? "bg-primary/70 text-white"
                        : "text-gray-700 hover:bg-gray-100/80 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="px-4 my-6">
          <SidebarSeparator />
        </div>

        <SidebarGroup className="p-0">
          <SidebarHeader>
            <p className="text-sm">General</p>
          </SidebarHeader>
          <SidebarGroupContent>
            <SidebarMenu className="px-4">
              {footerItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-primary/70 text-white"
                        : "text-gray-700 hover:bg-gray-100/80 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
              <SidebarFooter className="">
                <LogoutButton />
              </SidebarFooter>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default DashboardSidebar;
