"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { RefreshCw, AlertCircle, WifiOff } from "lucide-react";
import { db } from "@/lib/db";
import { flushSyncQueue } from "@/lib/offline/flushSyncQueue";
import { useState } from "react";
import { useNetworkStatus } from "@/hooks/use-network-status";

export function SyncStatusBar() {
  const { isSyncing: isAutoSyncing, isOnline } = useNetworkStatus();
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const pendingSaleCount =
    useLiveQuery(
      () =>
        db.pendingSales.where("syncStatus").anyOf("PENDING", "SYNCING").count(),
      [],
    ) ?? 0;

  const pendingShiftCount =
    useLiveQuery(
      () =>
        db.activeShift.where("syncStatus").anyOf("PENDING", "FAILED").count(),
      [],
    ) ?? 0;

  const failedSales =
    useLiveQuery(
      () => db.pendingSales.where("syncStatus").equals("FAILED").toArray(),
      [],
    ) ?? [];
  const failedSaleCount = failedSales.length;

  const failedShifts =
    useLiveQuery(
      () => db.activeShift.where("syncStatus").equals("FAILED").toArray(),
      [],
    ) ?? [];
  const failedShiftCount = failedShifts.length;

  const pendingCount = pendingSaleCount + pendingShiftCount;
  const failedCount = failedSaleCount + failedShiftCount;
  const firstError = failedShifts[0]?.syncError ?? failedSales[0]?.syncError;

  const isSyncing = isAutoSyncing || isManualSyncing;

  const handleRetry = async () => {
    if (isSyncing) return;
    setIsManualSyncing(true);
    try {
      await flushSyncQueue();
    } finally {
      setIsManualSyncing(false);
    }
  };

  // Nothing to show — all synced and no failures
  if (pendingCount === 0 && failedCount === 0 && !isSyncing) {
    return null;
  }

  // Build descriptive queue text
  const queueParts: string[] = [];
  if (pendingShiftCount > 0)
    queueParts.push(
      `${pendingShiftCount} shift${pendingShiftCount !== 1 ? "s" : ""}`,
    );
  if (pendingSaleCount > 0)
    queueParts.push(
      `${pendingSaleCount} sale${pendingSaleCount !== 1 ? "s" : ""}`,
    );
  const queueText = queueParts.join(" + ");

  const failedParts: string[] = [];
  if (failedShiftCount > 0)
    failedParts.push(
      `${failedShiftCount} shift${failedShiftCount !== 1 ? "s" : ""}`,
    );
  if (failedSaleCount > 0)
    failedParts.push(
      `${failedSaleCount} sale${failedSaleCount !== 1 ? "s" : ""}`,
    );
  const failedText = failedParts.join(" + ");

  const bgColor =
    failedCount > 0
      ? "bg-red-500"
      : !isOnline
        ? "bg-orange-500"
        : "bg-blue-500";

  return (
    <div
      role="button"
      tabIndex={failedCount > 0 ? 0 : undefined}
      onKeyDown={
        failedCount > 0
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleRetry();
              }
            }
          : undefined
      }
      className={`fixed bottom-4 left-20 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white shadow-lg transition-all ${bgColor} ${failedCount > 0 ? "cursor-pointer hover:opacity-90" : ""}`}
      onClick={failedCount > 0 ? handleRetry : undefined}
      title={failedCount > 0 ? "Tap to retry failed syncs" : undefined}
    >
      {failedCount > 0 ? (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{failedText} failed — tap to retry</span>
          </div>
          {firstError && (
            <span className="text-[10px] opacity-90 truncate max-w-[300px]">
              {firstError}
            </span>
          )}
        </div>
      ) : !isOnline ? (
        <>
          <WifiOff className="h-4 w-4" />
          <span>{queueText} queued</span>
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Syncing{queueText ? ` ${queueText}` : ""}...</span>
        </>
      )}
    </div>
  );
}
