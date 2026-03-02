import { db } from "@/lib/db";
import apiClient from "@/lib/axios";
import { PendingSale } from "@/lib/db";

let isFlushing = false;

export async function flushSyncQueue(): Promise<void> {
  if (isFlushing) return;
  isFlushing = true;

  try {
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

        const response = await apiClient.post("/sales", {
          cuid: sale.cuid,
          items: sale.items.map((item: PendingSale["items"][number]) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          payments: sale.payments,
          discount: sale.discount,
          customerId: sale.customerId,
          creditDueDate: sale.creditDueDate,
          localReference: sale.localReference,
        });

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
        } else {
          await db.pendingSales.update(sale.localId, {
            syncStatus: "FAILED",
            syncError: axiosError.message ?? "Unknown error",
            syncAttempts: (sale.syncAttempts ?? 0) + 1,
          });
        }
      }
    }
  } finally {
    isFlushing = false;
  }
}
