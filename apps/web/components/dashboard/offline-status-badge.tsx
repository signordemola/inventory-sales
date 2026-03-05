"use client";

import React, { useEffect } from "react";
import { WifiOff, RefreshCcw, CloudUpload, AlertCircle } from "lucide-react";
import { useIsOnline } from "@/hooks/use-is-online";
import { usePendingSalesCount } from "@/hooks/use-pending-sales-count";
import { flushSyncQueue } from "@/lib/offline/flushSyncQueue";
import { cn } from "@/lib/utils";

export function OfflineStatusBadge() {
  const isOnline = useIsOnline();
  const { count, hasHardFailed, retrySync } = usePendingSalesCount();

  // --- Auto-retry: flush every 30s when online and there are pending sales ---
  useEffect(() => {
    if (!isOnline) return;
    if (count === 0 && !hasHardFailed) return;

    const interval = setInterval(() => {
      if (navigator.onLine) {
        flushSyncQueue();
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [isOnline, count, hasHardFailed]);

  // When coming back online, immediately try to flush
  useEffect(() => {
    if (isOnline && count > 0) {
      flushSyncQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  // Nothing to show when fully synced and online
  if (isOnline && count === 0 && !hasHardFailed) return null;

  // Hard-failed sales badge (requires manual retry)
  if (hasHardFailed) {
    return (
      <button
        onClick={retrySync}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
          "bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400",
          "hover:bg-red-100 transition-colors",
        )}
        title="Some sales failed to sync after 5 attempts. Click to retry."
      >
        <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
        Sync Failed — Retry
      </button>
    );
  }

  // Offline badge
  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
        <WifiOff className="w-3.5 h-3.5" />
        Offline
        {count > 0 && (
          <span className="ml-1 bg-amber-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5">
            {count}
          </span>
        )}
      </div>
    );
  }

  // Online but pending uploads
  if (count > 0) {
    return (
      <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-400">
        <CloudUpload className="w-3.5 h-3.5" />
        <RefreshCcw className="w-3 h-3 animate-spin" />
        {count} pending
      </div>
    );
  }

  return null;
}
