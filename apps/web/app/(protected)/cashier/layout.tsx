import { getSession } from "@/lib/session";
import { UserRole } from "@/types";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function CashierLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  if (!session || session.user.role !== UserRole.CASHIER) {
    redirect("/");
  }
  return (
    <div>
      <h1>Cashier Layout</h1> {children}
    </div>
  );
}
