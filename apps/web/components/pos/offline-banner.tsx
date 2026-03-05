"use client";

import { WifiOff } from "lucide-react";
import { useNetworkStatus } from "@/hooks/use-network-status";

/**
 * Full-width amber banner shown at the top of the POS page when
 * the backend is unreachable. Matches the ShiftDurationWarning style.
 */
export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-orange-500 text-white">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>
        You&apos;re offline — sales will be saved locally and synced when
        connection is restored
      </span>
    </div>
  );
}
