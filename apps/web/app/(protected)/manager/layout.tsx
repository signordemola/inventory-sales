import { getSession } from "@/lib/session";
import { UserRole } from "@/types";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function ManagerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  if (!session || session.user.role !== UserRole.MANAGER) {
    redirect("/");
  }
  return (
    <div>
      <h1>Manager Layout</h1> {children}
    </div>
  );
}
