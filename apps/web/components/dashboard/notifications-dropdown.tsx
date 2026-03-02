"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  AlertTriangle,
  PackageX,
  CreditCard,
  FileText,
  CheckCircle2,
  AlertOctagon,
} from "lucide-react";
import apiClient from "@/lib/axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

type NotificationType =
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | "PAYMENT_CONFIRMED"
  | "PURCHASE_ORDER_RECEIVED"
  | "CREDIT_DUE"
  | "STOCK_DISCREPANCY";

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const { data } = await apiClient.get<Notification[]>("/notifications");
      setNotifications(data);
    } catch {
      // Handle error implicitly
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch {
      // Ignore
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // Ignore
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "LOW_STOCK":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "OUT_OF_STOCK":
        return <PackageX className="h-4 w-4 text-red-500" />;
      case "STOCK_DISCREPANCY":
        return <AlertOctagon className="h-4 w-4 text-orange-500" />; // The new type
      case "CREDIT_DUE":
        return <CreditCard className="h-4 w-4 text-blue-500" />;
      case "PAYMENT_CONFIRMED":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "PURCHASE_ORDER_RECEIVED":
        return <FileText className="h-4 w-4 text-indigo-500" />;
      default:
        return <Bell className="h-4 w-4 text-slate-500" />;
    }
  };

  const getStyle = (type: NotificationType, read: boolean) => {
    if (read) return "opacity-60";
    switch (type) {
      case "STOCK_DISCREPANCY":
        return "bg-orange-50/50 border-orange-100";
      case "OUT_OF_STOCK":
        return "bg-red-50/50 border-red-100";
      case "LOW_STOCK":
        return "bg-amber-50/50 border-amber-100";
      default:
        return "bg-slate-50/50 border-slate-100";
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="relative rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 shadow-none transition-colors p-2 inline-flex items-center justify-center outline-none">
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 ring-2 ring-white dark:ring-slate-900"></span>
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <DropdownMenuLabel className="font-bold p-0">
            Notifications
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-[10px] h-5">
                {unreadCount} new
              </Badge>
            )}
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              You&apos;re all caught up!
            </div>
          ) : (
            <DropdownMenuGroup className="p-2 space-y-1">
              {notifications.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${getStyle(
                    n.type,
                    n.read,
                  )}`}
                  onClick={() => !n.read && markAsRead(n.id)}
                >
                  <div className="mt-0.5 shrink-0 bg-white p-1.5 rounded-full shadow-sm">
                    {getIcon(n.type)}
                  </div>
                  <div className="space-y-1 min-w-0 pr-2">
                    <p
                      className={`text-sm leading-snug ${
                        n.read
                          ? "text-slate-600"
                          : "font-semibold text-slate-900"
                      }`}
                    >
                      {n.message}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      {formatDistanceToNow(new Date(n.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
