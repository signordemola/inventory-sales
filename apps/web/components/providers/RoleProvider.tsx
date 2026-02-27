"use client";

import { createContext, useContext } from "react";
import type { UserRoleType } from "@/types";

interface RoleContextValue {
  role: UserRoleType;
  user: {
    id: string;
    name: string;
    email: string;
    businessId?: string | null;
  };
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({
  role,
  user,
  children,
}: RoleContextValue & { children: React.ReactNode }) {
  return (
    <RoleContext.Provider value={{ role, user }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within <RoleProvider>");
  return ctx;
}
