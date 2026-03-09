import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  History,
  ClipboardList,
  ShieldCheck,
  Settings,
  HelpCircle,
  Truck,
  Clock,
  FileBarChart,
  Wallet,
} from "lucide-react";

export const UserRole = {
  OWNER: "OWNER",
  MANAGER: "MANAGER",
  CASHIER: "CASHIER",
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

interface MenuItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  roles?: UserRoleType[];
}

export const menuItems: MenuItem[] = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    roles: ["OWNER", "MANAGER", "CASHIER"],
  },
  {
    href: "/pos",
    icon: ShoppingCart,
    label: "POS Terminal",
    roles: ["OWNER", "MANAGER", "CASHIER"],
  },
  {
    href: "/products",
    icon: Package,
    label: "Products",
    roles: ["OWNER", "MANAGER"],
  },
  {
    href: "/inventory",
    icon: ClipboardList,
    label: "Inventory",
    roles: ["OWNER", "MANAGER"],
  },
  {
    href: "/suppliers",
    icon: Truck,
    label: "Suppliers",
    roles: ["OWNER", "MANAGER"],
  },
  {
    href: "/customers",
    icon: Users,
    label: "Customers",
    roles: ["OWNER", "MANAGER"],
  },
  {
    href: "/transactions",
    icon: History,
    label: "Transactions",
    roles: ["OWNER", "MANAGER", "CASHIER"],
  },
  {
    href: "/staff",
    icon: ShieldCheck,
    label: "Staff / Access",
    roles: ["OWNER"],
  },
  {
    href: "/shifts",
    icon: Clock,
    label: "Shifts",
    roles: ["OWNER", "MANAGER"],
  },
  {
    href: "/reports",
    icon: FileBarChart,
    label: "Reports",
    roles: ["OWNER"],
  },
  {
    href: "/payroll",
    icon: Wallet,
    label: "Payroll",
    roles: ["OWNER"],
  },
];

export const footerItems: MenuItem[] = [
  {
    href: "/settings",
    icon: Settings,
    label: "Settings",
    roles: ["OWNER"],
  },
  {
    href: "/support",
    icon: HelpCircle,
    label: "Support",
    roles: ["OWNER", "MANAGER", "CASHIER"],
  },
];
