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

// ─── Shift Types ──────────────────────────────────────────────────────────────

export interface LocalShift {
  id: string; // server ID or local CUID
  status: "OPEN" | "CLOSED";
  openedAt: string; // ISO timestamp
  startingCash: number;
  syncStatus: "SYNCED" | "PENDING" | "FAILED";
  syncError?: string;
  lastSyncedAt: number;
}

// ─── Business Settings ─────────────────────────────────────────────────────────

export interface LocalBusinessSettings {
  id: string; // "settings"
  taxRate: number;
}

// ─── Database ─────────────────────────────────────────────────────────────────

class NaijaStockDB extends Dexie {
  products!: Table<Product, string>;
  categories!: Table<Category, string>;
  stockLevels!: Table<LocalStockLevel, string>;
  customers!: Table<LocalCustomer, string>;
  pendingSales!: Table<PendingSale, number>;
  seedMeta!: Table<LocalSeedMeta, string>;
  activeShift!: Table<LocalShift, string>;
  businessSettings!: Table<LocalBusinessSettings, string>;

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

    this.version(3).stores({
      products: "&id, name, sku, barcode, categoryId",
      categories: "&id",
      stockLevels: "&productId",
      customers: "&id, name, phone",
      pendingSales: "++localId, &cuid, syncStatus, createdAt",
      seedMeta: "&key",
      activeShift: "&id, status, syncStatus",
    });

    this.version(4).stores({
      products: "&id, name, sku, barcode, categoryId",
      categories: "&id",
      stockLevels: "&productId",
      customers: "&id, name, phone",
      pendingSales: "++localId, &cuid, syncStatus, createdAt",
      seedMeta: "&key",
      activeShift: "&id, status, syncStatus",
      businessSettings: "&id",
    });
  }
}

export const db = new NaijaStockDB();
