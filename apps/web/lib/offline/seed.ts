import { db, LocalCustomer } from "@/lib/db";
import apiClient from "@/lib/axios";
import { Product, Category } from "@/types/products";

const SEED_INTERVAL_MS = 15 * 60 * 1000;

export async function seedOfflineData(): Promise<void> {
  const meta = await db.seedMeta.get("lastSeededAt");
  if (meta && Date.now() - meta.value < SEED_INTERVAL_MS) {
    console.log("[NaijaStock] Seed skipped — seeded recently.");
    return;
  }

  console.log("[NaijaStock] Seeding offline data...");

  try {
    const [productsRes, categoriesRes, customersRes] = await Promise.all([
      apiClient.get<{ items: Product[] }>("/products", {
        params: { limit: 5000, isActive: true },
      }),
      apiClient.get<Category[]>("/categories"),
      apiClient.get<
        Array<{
          id: string;
          name: string;
          phone?: string;
          email?: string;
          businessId: string;
          creditSales?: Array<{ balance: number }>;
        }>
      >("/customers"),
    ]);

    const products = productsRes.data.items ?? [];
    const categories = categoriesRes.data ?? [];
    const rawCustomers = customersRes.data ?? [];
    const now = Date.now();

    // Map customers, summing outstanding credit balances
    const customers: LocalCustomer[] = rawCustomers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      businessId: c.businessId,
      creditBalance: (c.creditSales ?? []).reduce(
        (sum, cs) => sum + Number(cs.balance),
        0,
      ),
      lastSyncedAt: now,
    }));

    await db.products.bulkPut(products);
    await db.categories.bulkPut(categories);
    await db.customers.bulkPut(customers);
    await db.stockLevels.bulkPut(
      products.map((p) => ({
        productId: p.id,
        quantity: Number(p.stockLevel ?? 0),
        threshold: Number(p.lowStockThreshold ?? 0),
        lastSyncedAt: now,
      })),
    );
    await db.seedMeta.put({ key: "lastSeededAt", value: now });

    console.log(
      `[NaijaStock] Seed complete. ${products.length} products, ${customers.length} customers cached.`,
    );
  } catch (error) {
    console.error("[NaijaStock] Offline seed failed:", error);
  }
}

export async function forceSeedOfflineData(): Promise<void> {
  await db.seedMeta.delete("lastSeededAt");
  await seedOfflineData();
}
