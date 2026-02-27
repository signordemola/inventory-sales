import { requireOwner } from "@/lib/dal";
import { ReactNode } from "react";

export default async function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireOwner();
  return <>{children}</>;
}
