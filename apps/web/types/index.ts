import {
  LayoutDashboard,
  Inbox,
  ShoppingCart,
  Package,
  CreditCard,
  Settings,
  HelpCircle,
  Users,
} from "lucide-react";

interface MenuItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

export const menuItems: MenuItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/leads", icon: Users, label: "Leads" },
  { href: "/inbox", icon: Inbox, label: "Inbox" },
  { href: "/orders", icon: ShoppingCart, label: "Orders" },
  { href: "/products", icon: Package, label: "Products" },
  { href: "/payments", icon: CreditCard, label: "Payments" },
];

export const footerItems: MenuItem[] = [
  { href: "/settings", icon: Settings, label: "Settings" },
  { href: "/help", icon: HelpCircle, label: "Help Center" },
];

export const UserRole = {
  OWNER: "OWNER",
  MANAGER: "MANAGER",
  CASHIER: "CASHIER",
} as const;
