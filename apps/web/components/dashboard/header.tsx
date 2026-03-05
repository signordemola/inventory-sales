"use client";

import { usePathname } from "next/navigation";
import { useSessionContext } from "@/lib/session-context";
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
import { Search } from "lucide-react";
import { formattedDate } from "@/lib/date";
import { NotificationsDropdown } from "./notifications-dropdown";
import { OfflineStatusBadge } from "./offline-status-badge";

const Header = () => {
  const pathname = usePathname();
  const { user } = useSessionContext();

  const segments = pathname.split("/").filter(Boolean);
  const userRole = user?.role || "cashier";

  const getLabel = (s: string) => {
    // If segment looks like a CUID or ObjID, display "Details" or standard generic name instead of the raw ID
    if (
      s.length >= 24 ||
      (s.length === 25 && s.startsWith("c")) ||
      s.startsWith("C")
    ) {
      return "Details";
    }

    const labels: Record<string, string> = {
      owner: "Owner Dashboard",
      manager: "Manager Dashboard",
      cashier: "Cashier Dashboard",
      dashboard: "Overview",
      pos: "Point of Sale",
      staff: "Team Management",
      products: "Products",
      suppliers: "Supply Chain",
      settings: "Configuration",
      categories: "Category Manager",
      new: "Add New Product",
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
                href={`/dashboard`}
                className="text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                {getLabel(userRole)}
              </BreadcrumbLink>
            </BreadcrumbItem>

            {segments.map((segment, index) => {
              const isLast = index === segments.length - 1;
              const href = `/${segments.slice(0, index + 1).join("/")}`;

              return (
                <div
                  key={segment}
                  className="flex items-center gap-1.5 sm:gap-2.5"
                >
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                        {getLabel(segment)}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        href={href}
                        className="text-xs font-medium text-slate-500 uppercase tracking-wider hover:text-slate-900 transition-colors"
                      >
                        {getLabel(segment)}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-3">
        <OfflineStatusBadge />
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

          <NotificationsDropdown />
        </div>
      </div>
    </header>
  );
};

export default Header;
