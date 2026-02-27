"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "../ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { Bell, Search } from "lucide-react";
import { formattedDate } from "@/lib/date";

const Header = () => {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);
  const role = segments[0] || "staff";
  const page = segments[1] || "dashboard";

  const getLabel = (s: string) => {
    const labels: Record<string, string> = {
      owner: "Business Owner",
      manager: "Store Manager",
      cashier: "Cashier POS",
      dashboard: "Overview",
      pos: "Point of Sale",
      staff: "Team Management",
      products: "Inventory",
      suppliers: "Supply Chain",
      settings: "Configuration",
    };
    return labels[s.toLowerCase()] || s.replace(/-/g, " ");
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center border-b bg-white dark:bg-slate-900 px-6">
      <div className="flex-1 flex items-center gap-4">
        <SidebarTrigger className="-ml-2 cursor-pointer text-slate-500 hover:text-slate-900 dark:hover:text-white" />

        <Separator orientation="vertical" className="h-6" />

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href={`/${role}/dashboard`}
                className="text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                {getLabel(role)}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                {getLabel(page)}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center text-xs font-semibold text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-800">
          {formattedDate}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 shadow-none transition-colors"
          >
            <Search className="size-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 shadow-none transition-colors"
          >
            <Bell className="size-5" />
            <span className="absolute right-1 top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"></span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
