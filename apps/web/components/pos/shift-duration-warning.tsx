"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShiftDurationWarningProps {
  shiftOpenedAt: string; // ISO date string
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
}

export function ShiftDurationWarning({
  shiftOpenedAt,
}: ShiftDurationWarningProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const update = () => {
      setElapsedMs(Date.now() - new Date(shiftOpenedAt).getTime());
    };
    update();
    const id = setInterval(update, 60_000); // update every minute
    return () => clearInterval(id);
  }, [shiftOpenedAt]);

  const hours = elapsedMs / 3_600_000;

  // Only show after 6 hours
  if (hours < 6 || dismissed) return null;

  const isCritical = hours >= 8;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-2.5 text-xs font-bold transition-all",
        isCritical ? "bg-red-500 text-white" : "bg-amber-400 text-amber-950",
      )}
    >
      <div className="flex items-center gap-2">
        {isCritical ? (
          <XCircle className="w-4 h-4 shrink-0" />
        ) : (
          <AlertTriangle className="w-4 h-4 shrink-0" />
        )}
        <span>
          {isCritical
            ? `⚠️ Your shift has been open for ${formatDuration(elapsedMs)}. Please close the register.`
            : `Your shift has been running for ${formatDuration(elapsedMs)}. Consider closing the register soon.`}
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="flex items-center gap-1 opacity-75">
          <Clock className="w-3 h-3" />
          {formatDuration(elapsedMs)}
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="opacity-60 hover:opacity-100 transition-opacity text-[10px] uppercase tracking-wider"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
