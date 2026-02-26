import Header from "@/components/dashboard/header";
import DashboardSidebar from "@/components/dashboard/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSession } from "@/lib/session";
import { SessionProvider } from "@/lib/session-context";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  return (
    <SessionProvider session={session}>
      <SidebarProvider defaultOpen={defaultOpen} className="bg-sidebar">
        <DashboardSidebar />
        <SidebarInset className="relative flex flex-col h-svh overflow-hidden bg-slate-50 dark:bg-slate-950">
          <Header />
          <main className="flex-1 overflow-y-auto w-full">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  );
}
