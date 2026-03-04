import Dexie, { type Table } from "dexie";
import { Product, Category } from "@/types/products";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocalStockLevel {
  productId: string;
  quantity: number;
  threshold: number;
  lastSyncedAt: number;
}

interface LocalSeedMeta {
  key: string;
  value: number;
}

export interface LocalCustomer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  businessId: string;
  // Derived — sum of outstanding credit balances
  creditBalance: number;
  lastSyncedAt: number;
}

export type PendingPaymentMethod =
  | "CASH"
  | "CARD"
  | "TRANSFER"
  | "PAYSTACK"
  | "CREDIT";

export interface PendingSaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PendingPayment {
  method: PendingPaymentMethod;
  amount: number;
}

export interface PendingSale {
  localId?: number;
  cuid: string;
  items: PendingSaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payments: PendingPayment[];
  customerId?: string;
  creditDueDate?: string;
  syncStatus: "PENDING" | "SYNCING" | "SYNCED" | "FAILED";
  syncError?: string;
  syncAttempts: number;
  localReference: string;
  serverId?: string;
  serverReference?: string;
  createdAt: number;
}

// ─── Database ─────────────────────────────────────────────────────────────────

class NaijaStockDB extends Dexie {
  products!: Table<Product, string>;
  categories!: Table<Category, string>;
  stockLevels!: Table<LocalStockLevel, string>;
  customers!: Table<LocalCustomer, string>;
  pendingSales!: Table<PendingSale, number>;
  seedMeta!: Table<LocalSeedMeta, string>;

  constructor() {
    super("NaijaStockDB");
    this.version(2).stores({
      products: "&id, name, sku, barcode, categoryId",
      categories: "&id",
      stockLevels: "&productId",
      customers: "&id, name, phone",
      pendingSales: "++localId, &cuid, syncStatus, createdAt",
      seedMeta: "&key",
    });
  }
}

export const db = new NaijaStockDB();
