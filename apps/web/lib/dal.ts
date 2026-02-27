import "server-only";
import { cache } from "react";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import type { UserRoleType } from "@/types";

export const getVerifiedSession = cache(async () => {
  const session = await getSession();
  if (!session) redirect("/");
  return session;
});

export const requireRole = cache(async (...roles: UserRoleType[]) => {
  const session = await getVerifiedSession();
  if (!roles.includes(session.user.role as UserRoleType)) {
    redirect("/unauthorized");
  }
  return session;
});

export const requireOwner = () => requireRole("OWNER");
export const requireManager = () => requireRole("OWNER", "MANAGER");
export const requireAny = () => requireRole("OWNER", "MANAGER", "CASHIER");

export const getCurrentBusinessId = cache(async () => {
  const session = await getVerifiedSession();
  if (!session.user.businessId) redirect("/onboarding");
  return session.user.businessId as string;
});
