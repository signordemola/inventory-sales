import { requireAny } from "@/lib/dal";
import { ReactNode } from "react";

export default async function InventoryLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAny();
  return <>{children}</>;
}
