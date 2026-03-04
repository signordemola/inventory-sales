"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { WifiOff, RefreshCw, AlertCircle } from "lucide-react";
import { db } from "@/lib/db";
import { flushSyncQueue } from "@/lib/offline/flushSyncQueue";
import { useEffect, useReducer } from "react";

type SyncState = {
  isOnline: boolean;
  isSyncing: boolean;
};

type SyncAction =
  | { type: "SET_ONLINE"; payload: boolean }
  | { type: "SET_SYNCING"; payload: boolean };

function syncReducer(state: SyncState, action: SyncAction): SyncState {
  switch (action.type) {
    case "SET_ONLINE":
      return { ...state, isOnline: action.payload };
    case "SET_SYNCING":
      return { ...state, isSyncing: action.payload };
    default:
      return state;
  }
}

export function SyncStatusBar() {
  const [state, dispatch] = useReducer(syncReducer, {
    isOnline: true,
    isSyncing: false,
  });

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
    let active = true;

    const handleOnline = async () => {
      if (!active) return;
      dispatch({ type: "SET_ONLINE", payload: true });
      dispatch({ type: "SET_SYNCING", payload: true });
      try {
        await flushSyncQueue();
      } finally {
        if (active) dispatch({ type: "SET_SYNCING", payload: false });
      }
    };

    const handleOffline = () => {
      if (!active) return;
      dispatch({ type: "SET_ONLINE", payload: false });
    };

    dispatch({ type: "SET_ONLINE", payload: navigator.onLine });
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      active = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    if (state.isSyncing) return;
    dispatch({ type: "SET_SYNCING", payload: true });
    try {
      await flushSyncQueue();
    } finally {
      dispatch({ type: "SET_SYNCING", payload: false });
    }
  };

  if (
    state.isOnline &&
    pendingCount === 0 &&
    failedCount === 0 &&
    !state.isSyncing
  ) {
    return null;
  }

  const bgColor = !state.isOnline
    ? "bg-orange-500"
    : failedCount > 0
      ? "bg-red-500"
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
      {!state.isOnline ? (
        <>
          <WifiOff className="h-4 w-4" />
          <span>
            Offline
            {pendingCount > 0 &&
              ` — ${pendingCount} sale${pendingCount !== 1 ? "s" : ""} queued`}
          </span>
        </>
      ) : state.isSyncing || pendingCount > 0 ? (
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
