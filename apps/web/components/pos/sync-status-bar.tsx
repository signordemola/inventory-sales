"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { WifiOff, RefreshCw, AlertCircle } from "lucide-react";
import { db } from "@/lib/db";
import { flushSyncQueue } from "@/lib/offline/flushSyncQueue";
import { useEffect, useState } from "react";

export function SyncStatusBar() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const pendingCount =
    useLiveQuery(
      () =>
        db.pendingSales.where("syncStatus").anyOf("PENDING", "SYNCING").count(),
      [],
    ) ?? 0;

  const failedSales =
    useLiveQuery(
      () => db.pendingSales.where("syncStatus").equals("FAILED").toArray(),
      [],
    ) ?? [];
  const failedCount = failedSales.length;
  const firstError = failedSales[0]?.syncError;

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setIsSyncing(true);
      try {
        await flushSyncQueue();
      } finally {
        setIsSyncing(false);
      }
    };
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await flushSyncQueue();
    } finally {
      setIsSyncing(false);
    }
  };

  // All synced and online → don't render anything
  if (isOnline && pendingCount === 0 && failedCount === 0 && !isSyncing) {
    return null;
  }

  const bgColor = !isOnline
    ? "bg-orange-500"
    : failedCount > 0
      ? "bg-red-500"
      : "bg-blue-500";

  return (
    <div
      className={`fixed bottom-4 left-20 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white shadow-lg transition-all ${bgColor} ${failedCount > 0 ? "cursor-pointer hover:opacity-90" : ""}`}
      onClick={failedCount > 0 ? handleRetry : undefined}
      title={failedCount > 0 ? "Tap to retry failed syncs" : undefined}
    >
      {!isOnline ? (
        <>
          <WifiOff className="h-4 w-4" />
          <span>
            Offline
            {pendingCount > 0 &&
              ` — ${pendingCount} sale${pendingCount !== 1 ? "s" : ""} queued`}
          </span>
        </>
      ) : isSyncing || pendingCount > 0 ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>
            Syncing {pendingCount} sale{pendingCount !== 1 ? "s" : ""}...
          </span>
        </>
      ) : failedCount > 0 ? (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>
              {failedCount} sale{failedCount !== 1 ? "s" : ""} failed — tap to
              retry
            </span>
          </div>
          {firstError && (
            <span className="text-[10px] opacity-90 truncate max-w-[300px]">
              {firstError}
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}
