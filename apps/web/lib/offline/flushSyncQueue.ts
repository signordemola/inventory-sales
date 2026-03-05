import { db } from "@/lib/db";
import apiClient from "@/lib/axios";
import { PendingSale } from "@/lib/db";

let isFlushing = false;

/** Detect network failures, server errors, and DB connection issues */
function isUnreachableError(error: unknown): boolean {
  const e = error as {
    code?: string;
    message?: string;
    response?: { status: number; data?: unknown };
  };

  // No response at all = network-level failure
  if (!e.response) return true;

  // Axios timeout
  if (e.code === "ECONNABORTED") return true;

  // Explicit network error
  if (e.message === "Network Error") return true;

  // Server returned 5xx
  if (e.response.status >= 500) return true;

  // Prisma DB connection error buried in response body
  const bodyStr =
    typeof e.response.data === "string"
      ? e.response.data
      : JSON.stringify(e.response.data ?? "");
  if (
    bodyStr.includes("Can't reach database server") ||
    bodyStr.includes("Database error")
  ) {
    return true;
  }

  return false;
}

export async function flushSyncQueue(): Promise<void> {
  if (isFlushing) return;
  isFlushing = true;

  try {
    // ── Step 1: Sync pending shifts BEFORE sales ──
    // The backend attaches sales to the active shift,
    // so the shift must exist server-side first.
    const pendingShifts = await db.activeShift
      .where("syncStatus")
      .anyOf("PENDING", "FAILED")
      .toArray();

    for (const shift of pendingShifts) {
      try {
        const response = await apiClient.post("/shifts/open", {
          startingCash: shift.startingCash,
        });

        // Replace the local CUID record with the server-assigned one
        await db.activeShift.delete(shift.id);
        await db.activeShift.put({
          id: response.data.id,
          status: "OPEN",
          openedAt: response.data.openedAt,
          startingCash: Number(response.data.startingCash),
          syncStatus: "SYNCED",
          lastSyncedAt: Date.now(),
        });

        console.log(
          `[NaijaStock] Shift synced: ${shift.id} → ${response.data.id}`,
        );
      } catch (error: unknown) {
        const axiosError = error as {
          response?: {
            status: number;
            data?: { message?: string };
          };
          message?: string;
        };

        if (axiosError.response?.status === 409) {
          // User already has an open shift on server — treat as success
          await db.activeShift.update(shift.id, {
            syncStatus: "SYNCED",
            lastSyncedAt: Date.now(),
          });
          console.log(
            `[NaijaStock] Shift already open on server for ${shift.id}`,
          );
        } else if (isUnreachableError(error)) {
          console.warn(
            `[NaijaStock] Backend unreachable for shift ${shift.id}, pausing sync queue`,
          );
          return; // Stop the flush queue entirely until connection returns
        } else {
          const errorMsg =
            axiosError.response?.data?.message ??
            axiosError.message ??
            "Unknown error";
          console.error(
            `[NaijaStock] Shift sync failed for ${shift.id}:`,
            errorMsg,
          );
          await db.activeShift.update(shift.id, {
            syncStatus: "FAILED",
            syncError: errorMsg,
          });
        }
      }
    }

    // ── Step 2: Sync pending sales (existing logic) ──
    const pendingSales = await db.pendingSales
      .where("syncStatus")
      .anyOf("PENDING", "FAILED")
      .filter((s: PendingSale) => (s.syncAttempts ?? 0) < 5)
      .toArray();

    if (pendingSales.length === 0) return;

    console.log(
      `[NaijaStock] Syncing ${pendingSales.length} pending sale(s)...`,
    );

    for (const sale of pendingSales) {
      if (!sale.localId) continue;

      try {
        await db.pendingSales.update(sale.localId, { syncStatus: "SYNCING" });

        const payload = {
          cuid: sale.cuid,
          items: sale.items.map((item: PendingSale["items"][number]) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          payments: sale.payments,
          discount: sale.discount,
          tax: sale.tax,
          customerId: sale.customerId,
          creditDueDate: sale.creditDueDate,
        };

        console.log(`[NaijaStock] Sending payload for ${sale.cuid}:`, payload);

        const response = await apiClient.post("/sales", payload);

        await db.pendingSales.update(sale.localId, {
          syncStatus: "SYNCED",
          serverId: response.data.id,
          serverReference: response.data.reference,
        });

        console.log(
          `[NaijaStock] Synced: ${sale.localReference} → ${response.data.reference}`,
        );
      } catch (error: unknown) {
        const axiosError = error as {
          response?: {
            status: number;
            data?: {
              existingId?: string;
              existingReference?: string;
            };
          };
          message?: string;
        };

        if (axiosError.response?.status === 409) {
          await db.pendingSales.update(sale.localId, {
            syncStatus: "SYNCED",
            serverId: axiosError.response.data?.existingId,
            serverReference: axiosError.response.data?.existingReference,
          });
        } else if (isUnreachableError(error)) {
          console.warn(
            `[NaijaStock] Backend unreachable for sale ${sale.cuid}, pausing sync queue`,
          );
          await db.pendingSales.update(sale.localId, { syncStatus: "PENDING" });
          return; // Stop flushing remainder
        } else {
          // Extract backend validation messages if available
          const errorPayload = axiosError.response?.data as
            | { message?: string | string[] }
            | undefined;
          let detailedError = axiosError.message ?? "Unknown error";
          if (errorPayload?.message) {
            detailedError = Array.isArray(errorPayload.message)
              ? errorPayload.message.join(", ")
              : typeof errorPayload.message === "string"
                ? errorPayload.message
                : detailedError;
          }

          console.error(
            `[NaijaStock] Sync failed for ${sale.localReference}:`,
            detailedError,
          );

          await db.pendingSales.update(sale.localId, {
            syncStatus: "FAILED",
            syncError: detailedError,
            syncAttempts: (sale.syncAttempts ?? 0) + 1,
          });
        }
      }
    }
  } finally {
    isFlushing = false;
  }
}
