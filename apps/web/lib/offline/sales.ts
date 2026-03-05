import { db, PendingSale, PendingSaleItem, PendingPayment } from "@/lib/db";
import { createId } from "@paralleldrive/cuid2";

export type CreateSaleOfflineInput = {
  items: PendingSaleItem[];
  payments: PendingPayment[];
  subtotal: number;
  tax: number;
  discount?: number;
  discountType?: "PERCENTAGE" | "FLAT";
  total: number;
  customerId?: string;
  creditDueDate?: string;
};

export async function createSaleOffline(
  input: CreateSaleOfflineInput,
): Promise<{ cuid: string; localReference: string }> {
  const cuid = createId();
  const createdAt = Date.now();
  const localReference = `LOCAL-${createdAt}`;

  // Optimistically deduct stock
  for (const item of input.items) {
    const stock = await db.stockLevels.get(item.productId);
    if (stock) {
      await db.stockLevels.put({
        ...stock,
        quantity: Math.max(0, stock.quantity - item.quantity),
      });
    }
  }

  const pendingSale: Omit<PendingSale, "localId"> = {
    cuid,
    items: input.items,
    subtotal: input.subtotal,
    tax: input.tax,
    discount: input.discount ?? 0,
    discountType: input.discountType,
    total: input.total,
    payments: input.payments,
    customerId: input.customerId,
    creditDueDate: input.creditDueDate,
    syncStatus: "PENDING",
    syncAttempts: 0,
    localReference,
    createdAt,
  };

  await db.pendingSales.add(pendingSale);

  // If credit sale, optimistically update local customer credit balance
  if (input.customerId && input.payments.some((p) => p.method === "CREDIT")) {
    const customer = await db.customers.get(input.customerId);
    if (customer) {
      await db.customers.put({
        ...customer,
        creditBalance: customer.creditBalance + input.total,
      });
    }
  }

  return { cuid, localReference };
}
