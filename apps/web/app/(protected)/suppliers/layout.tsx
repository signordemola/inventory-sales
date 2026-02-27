import { requireManager } from "@/lib/dal";
import { ReactNode } from "react";

export default async function SuppliersLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireManager();
  return <>{children}</>;
}
