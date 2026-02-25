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
import { Bell } from "lucide-react";
import { Badge } from "../ui/badge";
import { formattedDate } from "@/lib/date";

const Header = () => {
  const pathname = usePathname();

  const segments = pathname.split("/");
  const page = segments[1];

  return (
    <header className="sticky top-0 z-50 flex h-20 shrink-0 items-center gap-2">
      <div className="w-full flex items-center gap-3 px-4 sm:px-6 py-4 border-b bg-background">
        <SidebarTrigger className="-ml-1 cursor-pointer" />

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink className="capitalize">
                {page ? page : "Dashboard"}
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator />

            <BreadcrumbItem>
              <BreadcrumbPage>Overview</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="ml-auto flex items-center gap-4">
          <div>
            <span>{formattedDate}</span>
          </div>
          <Separator orientation="vertical" />
          <Button
            variant="ghost"
            size="icon"
            className="relative size-9 shrink-0"
            aria-label="Notifications"
          >
            <Bell className="size-5" />
            <Badge className="absolute bg-destructive text-white -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px]">
              10
            </Badge>
          </Button>

          {/* <UserMenu /> */}
        </div>
      </div>
    </header>
  );
};

export default Header;
