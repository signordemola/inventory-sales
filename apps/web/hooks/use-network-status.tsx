"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";
import { flushSyncQueue } from "@/lib/offline/flushSyncQueue";

// ── Types ─────────────────────────────────────────────────────────────────────

type NetworkState = {
  isOnline: boolean;
  isSyncing: boolean;
};

type NetworkAction =
  | { type: "SET_ONLINE"; payload: boolean }
  | { type: "SET_SYNCING"; payload: boolean };

// ── Context ───────────────────────────────────────────────────────────────────

const NetworkStatusContext = createContext<NetworkState>({
  isOnline: true,
  isSyncing: false,
});

function networkReducer(
  state: NetworkState,
  action: NetworkAction,
): NetworkState {
  switch (action.type) {
    case "SET_ONLINE":
      return { ...state, isOnline: action.payload };
    case "SET_SYNCING":
      return { ...state, isSyncing: action.payload };
    default:
      return state;
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

/**
 * Wrap the POS page (or any subtree) with this provider.
 * It runs a SINGLE backend health-check ping every 10 seconds
 * and shares the result with all consumers via context.
 */
export function NetworkStatusProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(networkReducer, {
    isOnline: true,
    isSyncing: false,
  });

  useEffect(() => {
    let active = true;

    const checkBackendHealth = async () => {
      try {
        const apiClient = (await import("@/lib/axios")).default;
        await apiClient.get("/shifts/current", { timeout: 5000 });
        if (active) dispatch({ type: "SET_ONLINE", payload: true });
      } catch {
        if (active) dispatch({ type: "SET_ONLINE", payload: false });
      }
    };

    const handleOnline = async () => {
      if (!active) return;
      await checkBackendHealth();
      if (!active) return;

      if (state.isOnline) {
        dispatch({ type: "SET_SYNCING", payload: true });
        try {
          await flushSyncQueue();
        } finally {
          if (active) dispatch({ type: "SET_SYNCING", payload: false });
        }
      }
    };

    const handleOffline = () => {
      if (!active) return;
      dispatch({ type: "SET_ONLINE", payload: false });
    };

    // Initial check
    if (navigator.onLine) {
      checkBackendHealth();
    } else {
      dispatch({ type: "SET_ONLINE", payload: false });
    }

    // Periodic health check every 10s
    const healthInterval = setInterval(() => {
      if (active) checkBackendHealth();
    }, 10_000);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      active = false;
      clearInterval(healthInterval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <NetworkStatusContext.Provider value={state}>
      {children}
    </NetworkStatusContext.Provider>
  );
}

// ── Consumer Hook ─────────────────────────────────────────────────────────────

/**
 * Read the shared network status from the nearest NetworkStatusProvider.
 * ONE health check, shared by ALL consumers.
 */
export function useNetworkStatus() {
  return useContext(NetworkStatusContext);
}
