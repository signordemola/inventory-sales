import { getSession } from "@/lib/session";
import { UserRole } from "@/types";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function OwnerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  if (!session || session.user.role !== UserRole.OWNER) {
    redirect("/");
  }
  return (
    <div>
      <h1>Owner Layout</h1> {children}
    </div>
  );
}
