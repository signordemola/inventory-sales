"use client";

import { createContext, useContext } from "react";
import { UserRoleType } from "@/types";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: UserRoleType;
  businessId?: string;
  isActive?: boolean;
}

export interface SessionData {
  user: SessionUser;
}

const SessionContext = createContext<SessionData | null>(null);

export function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: SessionData;
}) {
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const ctx = useContext(SessionContext);
  if (!ctx)
    throw new Error("useSessionContext must be used inside SessionProvider");
  return ctx;
}
