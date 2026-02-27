import type { UserRoleType } from "@/types";

export const PERMISSIONS = {
  "products:view": ["OWNER", "MANAGER", "CASHIER"],
  "products:create": ["OWNER", "MANAGER"],
  "products:edit": ["OWNER", "MANAGER"],
  "products:delete": ["OWNER"],
  "categories:manage": ["OWNER", "MANAGER"],
  "inventory:view": ["OWNER", "MANAGER", "CASHIER"],
  "inventory:adjust": ["OWNER", "MANAGER"],
  "inventory:view:movements": ["OWNER", "MANAGER"],
  "purchase-orders:manage": ["OWNER", "MANAGER"],
  "suppliers:manage": ["OWNER", "MANAGER"],
  "sales:create": ["OWNER", "MANAGER", "CASHIER"],
  "sales:view:own": ["CASHIER"],
  "sales:view:all": ["OWNER", "MANAGER"],
  "sales:void": ["OWNER", "MANAGER"],
  "sales:return": ["OWNER", "MANAGER"],
  "customers:view": ["OWNER", "MANAGER", "CASHIER"],
  "customers:create": ["OWNER", "MANAGER", "CASHIER"],
  "customers:edit": ["OWNER", "MANAGER"],
  "customers:delete": ["OWNER"],
  "credits:create": ["OWNER", "MANAGER", "CASHIER"],
  "credits:view:own": ["CASHIER"],
  "credits:view:all": ["OWNER", "MANAGER"],
  "credits:repayment:add": ["OWNER", "MANAGER"],
  "reports:full": ["OWNER"],
  "reports:limited": ["OWNER", "MANAGER"],
  "staff:manage": ["OWNER"],
  "staff:invite": ["OWNER"],
  "settings:manage": ["OWNER"],
  "audit-logs:view": ["OWNER"],
  "notifications:view:own": ["OWNER", "MANAGER", "CASHIER"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(
  role: UserRoleType,
  permission: Permission,
): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}

export function canAny(role: UserRoleType, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}
