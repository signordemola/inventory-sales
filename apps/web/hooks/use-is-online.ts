"use client";

import { useState, useEffect } from "react";

/**
 * Returns true when the browser reports the device is online.
 * Defaults to `true` for SSR. State updates happen inside event
 * listener callbacks, not synchronously in the effect body.
 */
export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Sync with the actual browser state after mount
    handleOnline();
    if (!navigator.onLine) handleOffline();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
