import { db, LocalShift } from "@/lib/db";
import { createId } from "@paralleldrive/cuid2";

/**
 * Cache a shift from an API response into IndexedDB.
 * Clears any previous cached shift first (only one active shift per device).
 */
export async function cacheShift(apiShift: {
  id: string;
  status: string;
  openedAt: string;
  startingCash: number | string;
}): Promise<void> {
  // Clear previous cached shift(s)
  await db.activeShift.clear();

  await db.activeShift.put({
    id: apiShift.id,
    status: apiShift.status === "OPEN" ? "OPEN" : "CLOSED",
    openedAt: apiShift.openedAt,
    startingCash: Number(apiShift.startingCash),
    syncStatus: "SYNCED",
    lastSyncedAt: Date.now(),
  });
}

/**
 * Get the locally cached active (OPEN) shift, or null if none exists.
 */
export async function getActiveShiftLocal(): Promise<LocalShift | null> {
  const shift = await db.activeShift.where("status").equals("OPEN").first();

  return shift ?? null;
}

/**
 * Remove all cached shift data (e.g. after closing a shift).
 */
export async function clearShiftCache(): Promise<void> {
  await db.activeShift.clear();
}

/**
 * Open a shift locally when offline.
 * Creates a record with a local CUID and syncStatus: "PENDING".
 * Returns the local shift so the POS can proceed immediately.
 */
export async function openShiftOffline(
  startingCash: number,
): Promise<LocalShift> {
  // Clear any stale cached shift
  await db.activeShift.clear();

  const localShift: LocalShift = {
    id: createId(),
    status: "OPEN",
    openedAt: new Date().toISOString(),
    startingCash,
    syncStatus: "PENDING",
    lastSyncedAt: Date.now(),
  };

  await db.activeShift.put(localShift);
  return localShift;
}
