"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/db";
import { flushSyncQueue } from "@/lib/offline/flushSyncQueue";

/**
 * Returns the count of sales currently pending sync (PENDING or FAILED, under 5 attempts).
 * Auto-refreshes every 5 seconds using setInterval.
 */
export function usePendingSalesCount() {
  const [count, setCount] = useState(0);
  const [hasHardFailed, setHasHardFailed] = useState(false);

  const refresh = useCallback(() => {
    Promise.all([
      db.pendingSales
        .where("syncStatus")
        .anyOf("PENDING", "SYNCING", "FAILED")
        .filter((s) => (s.syncAttempts ?? 0) < 5)
        .count(),
      db.pendingSales
        .where("syncStatus")
        .equals("FAILED")
        .filter((s) => (s.syncAttempts ?? 0) >= 5)
        .count(),
    ]).then(([pending, hardFailed]) => {
      setCount(pending);
      setHasHardFailed(hardFailed > 0);
    });
  }, []);

  useEffect(() => {
    // Kick off initial read asynchronously via callback
    const timer = setTimeout(refresh, 0);
    const interval = setInterval(refresh, 5000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [refresh]);

  const retrySync = useCallback(async () => {
    // Reset hard-failed sales back to PENDING so they can be retried
    await db.pendingSales
      .where("syncStatus")
      .equals("FAILED")
      .modify({ syncStatus: "PENDING", syncAttempts: 0 });
    await flushSyncQueue();
    refresh();
  }, [refresh]);

  return { count, hasHardFailed, retrySync };
}
