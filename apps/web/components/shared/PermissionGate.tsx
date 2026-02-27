"use client";

import { useRole } from "@/components/providers/RoleProvider";
import { hasPermission, canAny } from "@/lib/permissions";
import type { Permission } from "@/lib/permissions";

interface Props {
  permission?: Permission;
  anyOf?: Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  permission,
  anyOf,
  children,
  fallback = null,
}: Props) {
  const { role } = useRole();

  const allowed = permission
    ? hasPermission(role, permission)
    : anyOf
      ? canAny(role, anyOf)
      : false;

  return allowed ? <>{children}</> : <>{fallback}</>;
}
