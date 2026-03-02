# NaijaStock — Offline-First Architecture
## Complete Implementation Guide for `apps/web`

---

## The Mental Model (Read This First)

The fundamental shift is this:

> **Stop thinking "call the API, show the result." Start thinking "write to local DB, show instantly, sync to server in background."**

<br>

The architecture has three layers:

```
┌─────────────────────────────────────────────┐
│         NAIJASTOCK POS (React UI)           │
│   Reads ONLY from IndexedDB (Dexie.js)      │
│   Writes ONLY to IndexedDB (Dexie.js)       │
└────────────────┬────────────────────────────┘
                 │ liveQuery (reactive)
┌────────────────▼────────────────────────────┐
│         LOCAL DATABASE (IndexedDB)          │
│   Products, Stock, Sales, Sync Queue        │
│   Dexie.js — lives in the browser           │
└────────────────┬────────────────────────────┘
                 │ Background sync (Service Worker)
┌────────────────▼────────────────────────────┐
│         NAIJASTOCK API (NestJS)             │
│   Source of truth — PostgreSQL              │
│   Receives synced data, returns updates     │
└─────────────────────────────────────────────┘
```

The UI **never** waits for the network. It reads and writes to IndexedDB. The Service Worker handles syncing to the server silently in the background. If there's no internet, the POS works anyway. When internet returns, it catches up automatically.

---

## Stack Decision

| Concern | Tool | Why |
|---|---|---|
| Local database | **Dexie.js** | Best IndexedDB wrapper. Reactive queries, TypeScript-first, versioned migrations |
| Reactive UI updates | **dexie-react-hooks** (`useLiveQuery`) | Re-renders automatically when local DB changes |
| Service Worker / caching | **Serwist** (`@serwist/next`) | Official Next.js-endorsed successor to `next-pwa` |
| Background sync | **Background Sync API** (via Serwist) | Queues writes; replays when online even if tab is closed |
| Connectivity detection | `navigator.onLine` + `online`/`offline` events | Built-in browser API |

---

## Step 1: Install Dependencies

```bash
# In apps/web
pnpm add dexie dexie-react-hooks
pnpm add @serwist/next @serwist/precaching @serwist/sw serwist
```

---

## Step 2: Define the Local Database Schema

Create `apps/web/lib/db.ts` — this is NaijaStock's offline brain.

```typescript
// apps/web/lib/db.ts
import Dexie, { type Table } from 'dexie';

// ─── Types (mirror your Prisma types from packages/shared) ───────────────────

export interface LocalProduct {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  categoryId?: string;
  categoryName?: string;    // denormalized for speed
  sellingPrice: number;
  buyingPrice: number;
  unit: string;
  images: string[];
  vatExempt: boolean;
  hasVariants: boolean;
  // Sync metadata
  lastSyncedAt: number;     // Unix timestamp
}

export interface LocalStockLevel {
  productId: string;
  variantId?: string;
  quantity: number;
  threshold: number;
  lastSyncedAt: number;
}

export interface LocalCategory {
  id: string;
  name: string;
  parentId?: string;
  lastSyncedAt: number;
}

export interface LocalCustomer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  creditBalance: number;
  lastSyncedAt: number;
}

export interface PendingSale {
  localId?: number;           // Auto-incremented by Dexie — local only
  uid: string;                // UUID generated client-side — used for dedup on server
  businessId: string;
  cashierId: string;
  cashierName: string;
  items: PendingSaleItem[];
  subtotal: number;
  discount: number;
  discountType: 'FLAT' | 'PERCENT';
  total: number;
  payments: PendingPayment[];
  customerId?: string;
  syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  syncError?: string;
  syncAttempts: number;
  localReference: string;     // e.g. LOCAL-1709042823441
  serverId?: string;          // populated after server confirms
  serverReference?: string;   // e.g. INV-20260227-0042
  createdAt: number;          // Unix timestamp
}

export interface PendingSaleItem {
  productId: string;
  variantId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PendingPayment {
  method: 'CASH' | 'CARD' | 'TRANSFER' | 'PAYSTACK' | 'CREDIT';
  amount: number;
  reference?: string;
}

export interface SyncQueueItem {
  id?: number;
  operation: 'CREATE_SALE' | 'STOCK_ADJUST' | 'CREDIT_REPAY';
  payload: Record<string, unknown>;
  retries: number;
  maxRetries: number;
  lastAttemptAt?: number;
  createdAt: number;
}

// ─── Database Class ──────────────────────────────────────────────────────────

export class NaijaStockDB extends Dexie {
  products!: Table<LocalProduct>;
  stockLevels!: Table<LocalStockLevel>;
  categories!: Table<LocalCategory>;
  customers!: Table<LocalCustomer>;
  pendingSales!: Table<PendingSale>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('NaijaStockDB');

    this.version(1).stores({
      // Dexie index syntax: '++' = auto-increment, '&' = unique, '*' = multiEntry
      products:     '&id, sku, &barcode, categoryId, name',
      stockLevels:  '[productId+variantId], productId',
      categories:   '&id, parentId',
      customers:    '&id, phone',
      pendingSales: '++localId, &uid, syncStatus, createdAt, cashierId',
      syncQueue:    '++id, operation, createdAt',
    });
  }
}

export const db = new NaijaStockDB();
```

---

## Step 3: Data Seeding — Pull from Server on Login

When a user logs in, immediately seed IndexedDB with the data the POS needs to function offline.

```typescript
// apps/web/lib/offline/seed.ts
import { db } from '@/lib/db';
import { api } from '@/lib/api';  // your existing axios instance

export async function seedOfflineData(businessId: string): Promise<void> {
  console.log('[NaijaStock] Seeding offline data...');

  try {
    // Fetch all data in parallel — don't wait for one before starting another
    const [products, categories, stockLevels, customers] = await Promise.all([
      api.get('/products?limit=10000').then(r => r.data.items),
      api.get('/categories').then(r => r.data),
      api.get('/inventory/stock?limit=10000').then(r => r.data.items),
      api.get('/customers?limit=5000').then(r => r.data.items),
    ]);

    // Write to IndexedDB in bulk (Dexie bulk operations are fast)
    await db.transaction('rw', [db.products, db.categories, db.stockLevels, db.customers], async () => {
      const now = Date.now();

      await db.products.bulkPut(
        products.map((p: any) => ({ ...p, lastSyncedAt: now }))
      );
      await db.categories.bulkPut(
        categories.map((c: any) => ({ ...c, lastSyncedAt: now }))
      );
      await db.stockLevels.bulkPut(
        stockLevels.map((s: any) => ({
          productId: s.productId,
          variantId: s.variantId ?? undefined,
          quantity: s.currentQuantity,
          threshold: s.threshold ?? 0,
          lastSyncedAt: now,
        }))
      );
      await db.customers.bulkPut(
        customers.map((c: any) => ({ ...c, lastSyncedAt: now }))
      );
    });

    console.log(`[NaijaStock] Offline seed complete. Products: ${products.length}`);
  } catch (error) {
    console.error('[NaijaStock] Offline seed failed:', error);
    // Don't throw — user can still proceed if partial data exists
  }
}

// Call this after login
// In your NextAuth session callback or after successful login redirect:
// await seedOfflineData(session.user.businessId);
```

**Background refresh — every 15 minutes while online:**
```typescript
// apps/web/lib/offline/backgroundSync.ts
export function startBackgroundRefresh(businessId: string) {
  // Only refresh if online
  const refresh = async () => {
    if (navigator.onLine) {
      await seedOfflineData(businessId);
    }
  };

  // Refresh every 15 minutes
  const interval = setInterval(refresh, 15 * 60 * 1000);

  // Also refresh immediately when coming back online
  window.addEventListener('online', refresh);

  // Return cleanup function
  return () => {
    clearInterval(interval);
    window.removeEventListener('online', refresh);
  };
}
```

---

## Step 4: Writing Sales Offline-First

This is the core of the offline POS. When a cashier hits "Checkout," you write to IndexedDB first — the UI responds instantly — then the sync happens in the background.

```typescript
// apps/web/lib/offline/sales.ts
import { db, type PendingSale } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function createSaleOffline(
  saleData: Omit<PendingSale, 'localId' | 'uid' | 'syncStatus' | 'syncAttempts' | 'localReference' | 'createdAt'>
): Promise<{ localId: number; uid: string; localReference: string }> {

  const uid = uuidv4();  // Unique ID for deduplication on server
  const createdAt = Date.now();
  const localReference = `LOCAL-${createdAt}`;

  // 1. Optimistically deduct stock from local IndexedDB
  await db.transaction('rw', [db.stockLevels, db.pendingSales, db.syncQueue], async () => {
    // Deduct stock locally for each item
    for (const item of saleData.items) {
      await db.stockLevels
        .where('[productId+variantId]')
        .equals([item.productId, item.variantId ?? undefined])
        .modify(stock => {
          stock.quantity = Math.max(0, stock.quantity - item.quantity);
        });
    }

    // Write the pending sale
    await db.pendingSales.add({
      uid,
      localReference,
      createdAt,
      syncStatus: 'PENDING',
      syncAttempts: 0,
      ...saleData,
    });

    // Add to sync queue for the service worker
    await db.syncQueue.add({
      operation: 'CREATE_SALE',
      payload: { uid, ...saleData },
      retries: 0,
      maxRetries: 5,
      createdAt,
    });
  });

  const localId = await db.pendingSales.where('uid').equals(uid).first()
    .then(s => s!.localId!);

  // 2. Trigger background sync (if browser supports it)
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    const sw = await navigator.serviceWorker.ready;
    await sw.sync.register('sync-pending-sales');
  } else {
    // Fallback: try to sync immediately if online
    if (navigator.onLine) {
      flushSyncQueue().catch(console.error);
    }
  }

  return { localId, uid, localReference };
}
```

**The flush function — syncs pending sales to the server:**
```typescript
// apps/web/lib/offline/flushSyncQueue.ts
import { db } from '@/lib/db';
import { api } from '@/lib/api';

export async function flushSyncQueue(): Promise<void> {
  const pendingSales = await db.pendingSales
    .where('syncStatus').anyOf('PENDING', 'FAILED')
    .and(sale => sale.syncAttempts < 5)
    .toArray();

  if (pendingSales.length === 0) return;

  console.log(`[NaijaStock] Syncing ${pendingSales.length} pending sale(s)...`);

  for (const sale of pendingSales) {
    try {
      // Mark as syncing
      await db.pendingSales.update(sale.localId!, { syncStatus: 'SYNCING' });

      const response = await api.post('/sales', {
        uid: sale.uid,         // Server uses this for idempotency
        items: sale.items,
        payments: sale.payments,
        discount: sale.discount,
        discountType: sale.discountType,
        customerId: sale.customerId,
        localReference: sale.localReference,
        createdAt: sale.createdAt,  // Preserve original timestamp
      });

      // Mark as synced, store server IDs
      await db.pendingSales.update(sale.localId!, {
        syncStatus: 'SYNCED',
        serverId: response.data.id,
        serverReference: response.data.reference,
      });

      // Remove from sync queue
      await db.syncQueue
        .where('operation').equals('CREATE_SALE')
        .and(item => (item.payload as any).uid === sale.uid)
        .delete();

    } catch (error: any) {
      const isConflict = error.response?.status === 409; // Already exists (idempotency)

      if (isConflict) {
        // Server already has this sale (duplicate sync attempt) — mark as synced
        await db.pendingSales.update(sale.localId!, {
          syncStatus: 'SYNCED',
          serverId: error.response.data.existingId,
          serverReference: error.response.data.existingReference,
        });
      } else {
        // Genuine failure — increment retry counter
        await db.pendingSales.update(sale.localId!, {
          syncStatus: 'FAILED',
          syncError: error.message,
          syncAttempts: (sale.syncAttempts ?? 0) + 1,
        });
      }
    }
  }
}
```

---

## Step 5: Idempotency on the NestJS Server

This is the backend change required for safe offline sync. When a sale arrives from the client, the server must handle the case where it has been submitted twice (network retry, double sync).

```typescript
// apps/api/src/sales/sales.service.ts — modify createSale method

async createSale(dto: CreateSaleDto, userId: string, businessId: string) {
  // Check for duplicate submission using uid
  if (dto.uid) {
    const existing = await this.prisma.sale.findFirst({
      where: { uid: dto.uid, businessId },
      select: { id: true, reference: true },
    });

    if (existing) {
      // Idempotent — return the existing sale, don't create a duplicate
      throw new ConflictException({
        message: 'Sale already processed',
        existingId: existing.id,
        existingReference: existing.reference,
      });
    }
  }

  // ... rest of your existing createSale logic ...
  // Add uid to the Sale.create() call:
  return this.prisma.sale.create({
    data: {
      uid: dto.uid,
      // ... all other fields
    },
  });
}
```

**Add `uid` to your Prisma Sale model:**
```prisma
model Sale {
  id        String   @id @default(cuid())
  uid       String?  @unique  // Client-generated UUID for idempotency
  // ... rest of your fields
}
```

---

## Step 6: Reactive POS UI with `useLiveQuery`

The power of Dexie.js is `useLiveQuery` — it re-renders the component automatically whenever the underlying IndexedDB data changes. No `useEffect`, no polling, no manual state management.

```typescript
// apps/web/app/(dashboard)/pos/page.tsx
'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useState } from 'react';

export default function POSPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Reactive product search — auto-updates when IndexedDB changes
  const products = useLiveQuery(
    async () => {
      if (!searchQuery.trim()) {
        return db.products.limit(50).toArray();
      }
      return db.products
        .where('name').startsWithIgnoreCase(searchQuery)
        .or('sku').startsWithIgnoreCase(searchQuery)
        .or('barcode').equals(searchQuery)
        .limit(20)
        .toArray();
    },
    [searchQuery]
  );

  // Reactive stock levels — updates instantly when a sale is made offline
  const stockMap = useLiveQuery(async () => {
    const levels = await db.stockLevels.toArray();
    return new Map(levels.map(l => [l.productId, l.quantity]));
  });

  // Reactive pending sales count (for the sync status badge)
  const pendingCount = useLiveQuery(() =>
    db.pendingSales.where('syncStatus').anyOf('PENDING', 'SYNCING', 'FAILED').count()
  );

  return (
    <div className="flex h-screen">
      {/* Sync Status Bar */}
      {pendingCount !== undefined && pendingCount > 0 && (
        <SyncStatusBar pendingCount={pendingCount} />
      )}

      {/* Left: Product Grid */}
      <ProductGrid
        products={products ?? []}
        stockMap={stockMap ?? new Map()}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Right: Cart */}
      <Cart onCheckout={handleCheckout} />
    </div>
  );
}
```

**Barcode scan → lookup from IndexedDB (instant, no network):**
```typescript
async function lookupByBarcode(barcode: string) {
  const product = await db.products.where('barcode').equals(barcode).first();
  if (product) {
    addToCart(product);
  } else {
    toast.error(`Product not found: ${barcode}`);
  }
}
```

---

## Step 7: Sync Status UI Component

Cashiers need to know their connection state without it being disruptive.

```tsx
// apps/web/components/pos/SyncStatusBar.tsx
'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { flushSyncQueue } from '@/lib/offline/flushSyncQueue';

export function SyncStatusBar() {
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const pendingCount = useLiveQuery(() =>
    db.pendingSales.where('syncStatus').anyOf('PENDING', 'SYNCING').count()
  ) ?? 0;

  const failedCount = useLiveQuery(() =>
    db.pendingSales.where('syncStatus').equals('FAILED').count()
  ) ?? 0;

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushSyncQueue().then(() => setLastSyncedAt(new Date()));
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Online, all synced — show nothing (clean UI)
  if (isOnline && pendingCount === 0 && failedCount === 0) return null;

  return (
    <div className={`fixed bottom-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium z-50 shadow-lg
      ${!isOnline ? 'bg-orange-500 text-white' : ''}
      ${isOnline && pendingCount > 0 ? 'bg-blue-500 text-white' : ''}
      ${failedCount > 0 ? 'bg-red-500 text-white' : ''}
    `}>
      {!isOnline ? (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Offline — {pendingCount} sale{pendingCount !== 1 ? 's' : ''} queued</span>
        </>
      ) : pendingCount > 0 ? (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Syncing {pendingCount} sale{pendingCount !== 1 ? 's' : ''}...</span>
        </>
      ) : failedCount > 0 ? (
        <>
          <AlertCircle className="w-4 h-4" />
          <span>{failedCount} sale{failedCount !== 1 ? 's' : ''} failed to sync — tap to retry</span>
        </>
      ) : null}
    </div>
  );
}
```

---

## Step 8: Service Worker with Serwist

**8a. Update `next.config.ts`:**

```typescript
// apps/web/next.config.ts
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',  // Disable SW in dev — avoids caching headaches
});

export default withSerwist({
  // your existing Next.js config
});
```

**8b. Create `apps/web/app/sw.ts` (the service worker):**

```typescript
// apps/web/app/sw.ts
import { defaultCache } from '@serwist/next/worker';
import { Serwist } from 'serwist';

// This enables Background Sync — syncs queued sales even when tab is closed
import { flushSyncQueue } from '@/lib/offline/flushSyncQueue';

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    ...defaultCache,
    {
      // Cache product images from Cloudinary
      matcher: /^https:\/\/res\.cloudinary\.com\//,
      handler: 'CacheFirst',
      options: {
        cacheName: 'product-images',
        expiration: { maxEntries: 500, maxAgeSeconds: 7 * 24 * 60 * 60 }, // 7 days
      },
    },
  ],
  fallbacks: {
    entries: [
      {
        url: '/offline',  // Your offline fallback page
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

// Background Sync — triggered by navigator.serviceWorker.sync.register()
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-sales') {
    event.waitUntil(flushSyncQueue());
  }
});

serwist.addEventListeners();
```

**8c. Create `apps/web/app/manifest.ts`:**

```typescript
// apps/web/app/manifest.ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NaijaStock',
    short_name: 'NaijaStock',
    description: 'Nigeria\'s enterprise inventory & POS system',
    start_url: '/pos',             // Open straight to POS, not dashboard
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#16a34a',        // NaijaStock green
    orientation: 'any',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
```

**8d. Create the offline fallback page:**

```tsx
// apps/web/app/offline/page.tsx
export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white gap-4">
      <div className="text-6xl">📶</div>
      <h1 className="text-2xl font-bold">You're offline</h1>
      <p className="text-slate-400 text-center max-w-sm">
        NaijaStock is still working. Your POS is fully functional.
        Any sales made will sync automatically when you're back online.
      </p>
      <a href="/pos" className="bg-green-600 px-6 py-3 rounded-lg font-medium hover:bg-green-700">
        Continue to POS →
      </a>
    </div>
  );
}
```

---

## Step 9: Register Service Worker in the App

```tsx
// apps/web/components/ServiceWorkerRegistrar.tsx
'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('[NaijaStock] SW registered:', registration.scope);
          },
          (error) => {
            console.error('[NaijaStock] SW registration failed:', error);
          }
        );
      });
    }
  }, []);

  return null;
}

// Add to apps/web/app/layout.tsx:
// <ServiceWorkerRegistrar />
```

---

## Step 10: What Works Offline vs. Needs Internet

Be explicit about this in your code and in your UI. Use a `requiresOnline` wrapper for features that cannot work offline.

| Feature | Offline | Notes |
|---|---|---|
| Product search (by name, SKU) | ✅ Yes | Reads from IndexedDB |
| Barcode scan → product lookup | ✅ Yes | Reads from IndexedDB |
| Add to cart, adjust quantities | ✅ Yes | Pure UI state |
| Create sale (cash / transfer) | ✅ Yes | Writes to IndexedDB, queued |
| Print receipt (local) | ✅ Yes | Generate from local sale data |
| Stock level display | ✅ Yes | From IndexedDB (with "last synced" badge) |
| Customer list (for credit sales) | ✅ Yes | Reads from IndexedDB |
| Credit sale creation | ✅ Yes | Queued for sync |
| Paystack payment | ❌ No | Requires internet by nature |
| FIRS e-invoice submission | ⏳ Queued | Queued → syncs when online |
| Email receipt | ⏳ Queued | Queued → syncs when online |
| Analytics / reports | ❌ No | Requires fresh server data |
| Inventory adjustments | ✅ Yes | Queued for sync |

---

## Step 11: Handling Conflict — Stock Goes Negative

Because stock can be deducted offline by multiple cashiers on different devices simultaneously, you need a conflict resolution strategy on the server.

**The rule for NaijaStock:** Server wins on stock levels; sales always succeed.

When a sale syncs and the server calculates it would make stock negative:
- Still create the sale (it already happened in the real world)
- Create a `StockMovement(ADJUSTMENT)` record flagging the discrepancy
- Send a notification to the owner: "Stock discrepancy detected on [Product]. Physical count recommended."
- Never silently reject a sale that happened offline

```typescript
// In SalesService.createSale — add after sale creation:
if (stockAfterSale < 0) {
  await this.prisma.notification.create({
    data: {
      businessId,
      type: 'STOCK_DISCREPANCY',
      message: `${productName} stock went below zero after offline sync. Physical count recommended.`,
      read: false,
    }
  });
}
```

---

## Step 12: Testing Offline Mode

Add this to your dev workflow before every release:

**In Chrome DevTools:**
1. Open DevTools → Network tab → throttle to "Offline"
2. Try to create a sale — it should succeed instantly
3. Check Application → IndexedDB → NaijaStockDB → pendingSales → you should see the pending sale
4. Switch Network back to "Online"
5. The service worker triggers Background Sync — the pending sale should disappear from IndexedDB and appear in your NestJS database within seconds

**Simulate flaky network:**
1. Chrome DevTools → Network → "Slow 3G"
2. Create 3-4 rapid sales
3. Check that all 4 queue correctly and all eventually sync

**Test background sync (tab closed):**
1. Create an offline sale
2. Close the browser tab completely
3. Turn off DevTools offline mode (real network is back)
4. Reopen the app — the pending sale should have synced already (via Background Sync API)

---

## Final File Structure in `apps/web`

```
apps/web/
├── app/
│   ├── manifest.ts                    ← PWA manifest
│   ├── sw.ts                          ← Service worker (Serwist)
│   ├── offline/
│   │   └── page.tsx                   ← Offline fallback page
│   └── (dashboard)/
│       └── pos/
│           └── page.tsx               ← POS with useLiveQuery
├── lib/
│   ├── db.ts                          ← Dexie schema (NaijaStockDB)
│   └── offline/
│       ├── seed.ts                    ← seedOfflineData()
│       ├── sales.ts                   ← createSaleOffline()
│       ├── flushSyncQueue.ts          ← flushSyncQueue()
│       └── backgroundSync.ts         ← startBackgroundRefresh()
├── components/
│   ├── ServiceWorkerRegistrar.tsx     ← Registers SW in layout
│   └── pos/
│       └── SyncStatusBar.tsx         ← Online/offline/syncing indicator
└── next.config.ts                     ← Serwist integration
```

---

## Summary: The Complete Data Flow

```
Cashier scans barcode
        ↓
lookupByBarcode() → reads IndexedDB → instant result, no network
        ↓
Cashier adds items, clicks Checkout
        ↓
createSaleOffline()
  ├── Deducts stock in IndexedDB (optimistic)
  ├── Writes PendingSale to IndexedDB (syncStatus: PENDING)
  └── Registers Background Sync with Service Worker
        ↓
UI shows success receipt immediately (from local data)
        ↓
[Background — whenever network is available]
Service Worker fires 'sync-pending-sales' event
        ↓
flushSyncQueue()
  ├── POSTs sale to NestJS /sales with uid (idempotency key)
  ├── Server checks uid — not seen before → creates sale
  ├── Returns serverId + INV reference
  └── Updates IndexedDB: syncStatus → SYNCED, serverReference → INV-20260227-0042
        ↓
SyncStatusBar updates (pendingCount goes to 0, badge disappears)
```

This architecture means a NaijaStock cashier in Oshodi market with unstable MTN data can ring up 50 sales, none of them will fail, and all of them will sync the moment their router comes back.

---

*NaijaStock — Built for Nigeria. Works everywhere.*