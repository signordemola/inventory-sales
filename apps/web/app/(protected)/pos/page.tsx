"use client";

import POSScreen from "@/components/pos/pos-screen";
import { useRole } from "@/components/providers/RoleProvider";

export default function POSPage() {
  const { role } = useRole();
  return <POSScreen userRole={role} />;
}
