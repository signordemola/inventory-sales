import Header from "@/components/dashboard/header";
import DashboardSidebar from "@/components/dashboard/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cookies } from "next/headers";
import { ReactNode } from "react";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <SidebarProvider defaultOpen={defaultOpen} className="bg-sidebar">
      <DashboardSidebar />
      <div className="h-svh overflow-hidden w-full">
        <div className="lg:border overflow-hidden flex flex-col justify-start h-full w-full">
          <Header />
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
