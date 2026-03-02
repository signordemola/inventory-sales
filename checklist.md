# DemolaDevop — Business Automation Systems

## Inventory & Sales Manager — Agent-Ready Build Checklist

### Production MVP — Starting From Scratch

**Contact:** demoladevop.com · demoladevop@gmail.com · Lagos, Nigeria

---

## 📊 Implementation Status

> Tasks 0–8, 14, 15, 17, and 18 are complete or mostly complete.
> Remaining work is grouped into MVP tiers:
> **Tier 1 (Must Have):** Tasks 19, 20, 10, 23
> **Tier 2 (Strong Value):** Tasks 9, 16, 11
> **Tier 3 (Polish):** Tasks 12, 13, 21, 22

---

## ✅ Task 0: Turborepo Monorepo Setup — ✅ COMPLETE

**Goal:** Scaffold the monorepo that houses the NestJS backend and Next.js frontend as separate apps with shared packages.

**Estimated Time:** 1–2 hours

- [x] 0.1 — Initialise Turborepo: `npx create-turbo@latest`
- [x] 0.2 — Choose `pnpm` as the package manager (recommended with Turborepo)
- [x] 0.3 — Set up workspace structure:
  ```
  apps/api        ← NestJS backend
  apps/web        ← Next.js frontend
  packages/shared ← shared types, DTOs, constants
  packages/ui     ← shared UI components (optional)
  ```
- [x] 0.4 — Configure `turbo.json` pipeline: `build`, `dev`, `lint`, `test` tasks
- [x] 0.5 — Configure root `package.json` scripts: `dev`, `build`, `lint`
- [x] 0.6 — Set up `.env` handling: `dotenv-cli` or turbo env config
- [x] 0.7 — Set up shared `tsconfig.json` in `packages/shared`
- [x] 0.8 — Verify: `pnpm dev` starts both apps simultaneously
- [x] 0.9 — Commit baseline monorepo structure

---

## ✅ Task 1: NestJS Backend Bootstrap — ✅ COMPLETE

**Goal:** Scaffold a production-ready NestJS application inside `apps/api` with all core infrastructure wired up.

**Estimated Time:** 1–2 hours

- [x] 1.1 — Scaffold NestJS inside `apps/api`: `nest new api --skip-git`
- [x] 1.2 — Install core dependencies:
  ```
  @nestjs/config, @nestjs/jwt, @nestjs/passport, passport-jwt
  @prisma/client, prisma
  class-validator, class-transformer
  @nestjs/swagger, swagger-ui-express
  ioredis, @nestjs/bull, bull
  nodemailer, @sendgrid/mail
  cloudinary, multer, @nestjs/platform-express
  pdf-lib, puppeteer (for receipts)
  ```
- [x] 1.3 — Configure `ConfigModule` globally (`useEnv: true`, `isGlobal: true`)
- [x] 1.4 — Set up `.env.example` with all required keys:
  ```
  DATABASE_URL, REDIS_URL, JWT_SECRET, JWT_EXPIRY
  CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
  PAYSTACK_SECRET_KEY, PAYSTACK_PUBLIC_KEY
  SENDGRID_API_KEY, MAIL_FROM
  ```
- [x] 1.5 — Set up global `ValidationPipe` in `main.ts` (`whitelist: true`, `transform: true`)
- [x] 1.6 — Set up global exception filter (`HttpExceptionFilter`)
- [x] 1.7 — Set up global interceptors: `LoggingInterceptor`, `TransformInterceptor`
- [x] 1.8 — Configure CORS for Next.js frontend origin
- [x] 1.9 — Set up Swagger at `/api/docs`
- [x] 1.10 — Create health check endpoint: `GET /health → { status: 'ok', timestamp }`
- [x] 1.11 — Verify: `npm run start:dev` boots without errors

---

## ✅ Task 2: Next.js Frontend Bootstrap — ✅ COMPLETE

**Goal:** Scaffold the Next.js frontend inside `apps/web` with all shared config, component structure, and API client wired.

**Estimated Time:** 1 hour

- [x] 2.1 — Scaffold Next.js inside `apps/web`: `npx create-next-app@latest web --typescript --tailwind --app`
- [x] 2.2 — Install frontend dependencies:
  ```
  axios, swr or @tanstack/react-query
  recharts (charts/analytics)
  react-hook-form, zod, @hookform/resolvers
  lucide-react (icons)
  zxing-js/library (barcode scanning)
  next-auth (authentication)
  @radix-ui/react-* (UI primitives)
  ```
- [x] 2.3 — Set up folder structure:
  ```
  app/(auth)/login
  app/(dashboard)/layout.tsx
  app/(dashboard)/inventory
  app/(dashboard)/sales
  app/(dashboard)/reports
  app/(dashboard)/settings
  components/ui, components/forms, components/charts
  lib/api.ts (axios instance with base URL + interceptors)
  lib/auth.ts (NextAuth config)
  ```
- [x] 2.4 — Configure NextAuth with JWT strategy pointing to NestJS backend
- [x] 2.5 — Set up axios instance with auth token injection and 401 redirect
- [x] 2.6 — Create shared layout: sidebar, topbar, breadcrumbs
- [x] 2.7 — Set up TailwindCSS theme: brand colours matching DemolaDevop palette
- [x] 2.8 — Verify: `pnpm dev` starts frontend on `localhost:3000` and backend on `localhost:3001`

---

## ✅ Task 3: Database Schema & Prisma Setup — ✅ COMPLETE

**Goal:** Design and migrate the full PostgreSQL schema. Every subsequent module depends on this.

**Estimated Time:** 2–3 hours

- [x] 3.1 — Install Prisma: `pnpm add prisma @prisma/client` (in `apps/api`)
- [x] 3.2 — Initialise Prisma: `npx prisma init`
- [x] 3.3 — Design and write full `schema.prisma` with these models:
  ```
  Business         — name, logo, address, currency, taxRate, timezone
  User             — email, password, role (OWNER|MANAGER|CASHIER), businessId
  Category         — name, description, parentId (self-relation for subcategories)
  Product          — name, sku, barcode, categoryId, unit, buyingPrice, sellingPrice, images[]
  ProductVariant   — productId, name (e.g. 'Red XL'), sku, price, stock
  StockRecord      — productId, variantId?, quantity, storeId
  StockMovement    — productId, type (IN|OUT|ADJUSTMENT), quantity, reason, userId, cost
  Supplier         — name, phone, email, address, businessId
  PurchaseOrder    — supplierId, status (PENDING|RECEIVED|PARTIAL), items[], total
  PurchaseOrderItem — orderId, productId, quantity, cost
  Sale             — reference, items[], subtotal, discount, total, paymentMethod, status
  SaleItem         — saleId, productId, variantId?, quantity, unitPrice, total
  Payment          — saleId, method (CASH|CARD|TRANSFER|PAYSTACK), amount, reference
  CreditSale       — saleId, customerId, amountPaid, balance, repayments[]
  Customer         — name, phone, email, businessId
  Receipt          — saleId, pdfUrl, sentAt
  Notification     — type, message, read, userId
  ```
- [x] 3.4 — Add all relations, indexes, and `@updatedAt` / `@createdAt` timestamps
- [x] 3.5 — Run initial migration: `npx prisma migrate dev --name init`
- [x] 3.6 — Generate Prisma client: `npx prisma generate`
- [x] 3.7 — Create `PrismaModule` and `PrismaService` (injectable, global)
- [x] 3.8 — Create database seed script: `seed.ts` with sample business, user, and 10 products
- [x] 3.9 — Verify: `npx prisma studio` shows all tables with correct schema
- [x] 3.10 — Document migration workflow in README

---

## ✅ Task 4: Auth System (JWT + RBAC) — ✅ COMPLETE

**Goal:** Secure every endpoint with JWT authentication and role-based access control.

**Estimated Time:** 2–3 hours

- [x] 4.1 — Create `AuthModule` with: `AuthService`, `AuthController`, `JwtStrategy`, `LocalStrategy`
- [x] 4.2 — `POST /auth/register` — create business + owner account in one step
- [x] 4.3 — `POST /auth/login` — return JWT access token + refresh token
- [x] 4.4 — `POST /auth/refresh` — refresh token rotation
- [x] 4.5 — `POST /auth/logout` — invalidate refresh token
- [x] 4.6 — `GET /auth/me` — return current user profile
- [x] 4.7 — Implement `JwtAuthGuard` (global default — all routes protected)
- [x] 4.8 — Implement `RolesGuard` with `@Roles()` decorator (OWNER, MANAGER, CASHIER)
- [x] 4.9 — Hash passwords with bcrypt (salt rounds: 12)
- [x] 4.10 — Store refresh tokens in Redis with TTL
- [x] 4.11 — Attach user + `businessId` to every request via JWT payload
- [x] 4.12 — Create `UsersModule`: CRUD for staff accounts within a business
- [x] 4.13 — `POST /users` — create staff account (OWNER only)
- [x] 4.14 — `PATCH /users/:id/role` — update staff role (OWNER only)
- [x] 4.15 — `DELETE /users/:id` — deactivate staff (OWNER only)
- [x] 4.16 — Test: verify CASHIER cannot access OWNER-only endpoints

---

## ✅ Task 5: Product & Category Module — ✅ COMPLETE

**Goal:** Full CRUD for products and categories — the core data every other module references.

**Estimated Time:** 3–4 hours

- [x] 5.1 — Create `CategoriesModule`: `CategoriesService`, `CategoriesController`
- [x] 5.2 — `POST /categories` — create category (with optional `parentId` for subcategory)
- [x] 5.3 — `GET /categories` — list all categories (tree structure)
- [x] 5.4 — `PATCH /categories/:id` — update category
- [x] 5.5 — `DELETE /categories/:id` — delete (block if products assigned)
- [x] 5.6 — Create `ProductsModule`: `ProductsService`, `ProductsController`
- [x] 5.7 — `POST /products` — create product with full details
- [x] 5.8 — `GET /products` — paginated list with filters: category, status, search, low-stock
- [x] 5.9 — `GET /products/:id` — single product with stock level and variants
- [x] 5.10 — `PATCH /products/:id` — update product details
- [x] 5.11 — `DELETE /products/:id` — delete (block if stock exists or sale records exist)
- [x] 5.12 — `POST /products/import` — bulk import via CSV upload
- [x] 5.13 — `POST /products/:id/images` — upload images to Cloudinary (Task 11 dependency)
- [x] 5.14 — ProductVariants sub-module:
  - `POST /products/:id/variants` — add variant
  - `PATCH /products/:id/variants/:variantId` — update
  - `DELETE /products/:id/variants/:variantId` — delete
- [x] 5.15 — Auto-generate SKU if not provided: `PREFIX-TIMESTAMP-RANDOM`
- [x] 5.16 — Barcode field: store as string, validate uniqueness
- [x] 5.17 — Add expiry date field for pharmacies/food businesses
- [x] 5.18 — Test: create product → verify it appears in GET list with correct stock

---

## ✅ Task 6: Inventory / Stock Module — ✅ COMPLETE

**Goal:** Real-time stock tracking — every movement in or out is recorded with a full audit trail.

**Estimated Time:** 3–4 hours

- [x] 6.1 — Create `InventoryModule`: `InventoryService`, `InventoryController`
- [x] 6.2 — `POST /inventory/stock-in` — receive new stock:
  - Body: `{ productId, variantId?, quantity, cost, supplierId?, notes }`
  - Action: create `StockMovement(IN)`, update `StockRecord`, update `PurchaseOrder` if linked
- [x] 6.3 — `POST /inventory/adjust` — manual stock adjustment:
  - Body: `{ productId, variantId?, quantityChange (±), reason }`
  - Action: create `StockMovement(ADJUSTMENT)`, update `StockRecord`, log user
- [x] 6.4 — `GET /inventory/stock` — paginated stock report: all products with current level
- [x] 6.5 — `GET /inventory/stock/:productId` — single product stock detail + movement history
- [x] 6.6 — `GET /inventory/movements` — audit log of all stock movements (filter by date, type, product)
- [x] 6.7 — `GET /inventory/low-stock` — list products below their configured threshold
- [x] 6.8 — `GET /inventory/expiring` — list products with expiry date within N days
- [x] 6.9 — `GET /inventory/out-of-stock` — list products with zero stock
- [x] 6.10 — Low-stock threshold config per product: `PATCH /products/:id/threshold`
- [x] 6.11 — Real-time stock reads from Redis cache (Task 13 dependency — wire later)
- [x] 6.12 — Stock valuation endpoint: `GET /inventory/valuation` → total stock value at buying price
- [x] 6.13 — Concurrency safety: use Prisma transactions when updating `StockRecord`
- [x] 6.14 — Test: stock-in 50 units → sell 5 → verify stock = 45
- [x] 6.15 — Test: adjust stock -3 (damaged) → verify movement log shows reason

---

## ✅ Task 7: Sales & POS Module — ✅ MOSTLY COMPLETE

**Goal:** The point-of-sale engine — create sales, handle payments, issue receipts, manage returns.

**Estimated Time:** 4–5 hours

- [x] 7.1 — Create `SalesModule`: `SalesService`, `SalesController`
- [x] 7.2 — `POST /sales` — create sale (full cart checkout):
  - Body: `{ items: [{productId, variantId?, quantity, unitPrice}], discount, paymentMethod, customerId? }`
  - Actions: validate stock → deduct `StockRecord` → create `Sale` + `SaleItems` → create `Payment` → generate receipt
  - Wrap entire flow in Prisma transaction — rollback on any failure
- [x] 7.3 — `GET /sales` — paginated list with filters: date range, payment method, cashier, status
- [x] 7.4 — `GET /sales/:id` — full sale detail: items, payment, receipt, cashier
- [x] 7.5 — `POST /sales/:id/return` — process return/refund:
  - Body: `{ items: [{saleItemId, quantity, reason}] }`
  - Actions: restock items → create refund payment record → update sale status
- [x] 7.6 — Sale status lifecycle: `PENDING → COMPLETED → PARTIALLY_RETURNED → RETURNED → VOID`
- [x] 7.7 — Payment method enum: `CASH`, `CARD`, `TRANSFER`, `PAYSTACK`, `CREDIT`
- [x] 7.8 — Split payment support: array of payment objects summing to total
- [x] 7.9 — Change calculator: if cash paid > total, record change given
- [x] 7.10 — Credit sale: if method = CREDIT, create `CreditSale` record with balance
- [x] 7.11 — `POST /sales/:id/credit/repay` — record repayment on credit sale
- [x] 7.12 — `GET /sales/credit/outstanding` — list all unpaid/partial credit sales
- [x] 7.13 — Daily close endpoint: `GET /sales/daily-summary?date=` → totals by method
- [x] 7.14 — Auto-generate sale reference: `INV-YYYYMMDD-XXXX`
- [ ] 7.15 — After sale: trigger receipt generation + email (via BullMQ queue — Task 12)
- [x] 7.16 — Shift / Drawer Management: Open Register (float) and Close Register (Z-Read summary)
- [ ] 7.17 — Pay-in / Pay-out: Record cash drawer movements (petty cash, manager drops)
- [x] 7.18 — Test: sale of 3 items → stock deducted → receipt generated → sale in report
- [x] 7.19 — Test: full return → stock restored → refund recorded

---

## ✅ Task 8: Supplier Module — ✅ COMPLETE

**Goal:** Manage suppliers and purchase orders — track stock sourcing and outstanding supplier payments.

**Estimated Time:** 2–3 hours

- [x] 8.1 — Create `SuppliersModule`: `SuppliersService`, `SuppliersController`
- [x] 8.2 — `POST /suppliers` — create supplier
- [x] 8.3 — `GET /suppliers` — paginated list with search
- [x] 8.4 — `GET /suppliers/:id` — supplier profile with purchase history and balance
- [x] 8.5 — `PATCH /suppliers/:id` — update supplier
- [x] 8.6 — `DELETE /suppliers/:id` — block if has purchase orders
- [x] 8.7 — Purchase Orders sub-module:
  - `POST /purchase-orders` — create order: supplierId, items[], expectedDelivery
  - `GET /purchase-orders` — paginated, filter by status
  - `GET /purchase-orders/:id` — full order detail
  - `PATCH /purchase-orders/:id/receive` — mark received, trigger stock-in for all items
  - `PATCH /purchase-orders/:id/partial` — mark partial receipt, specify received quantities
- [x] 8.8 — Supplier payment tracking: record amounts paid vs total owed
- [x] 8.9 — `POST /suppliers/:id/payments` — record payment to supplier
- [x] 8.10 — `GET /suppliers/:id/balance` — outstanding balance owed to supplier
- [x] 8.11 — Test: create PO → mark received → verify stock levels updated for all items

---

## ✅ Task 9: Paystack Payment Integration — ❌ NOT STARTED (Tier 2 MVP)

**Goal:** Accept card/transfer payments online via Paystack for sales and generate verified payment references.

**Estimated Time:** 2–3 hours

- [ ] 9.1 — Create `PaystackModule` with `PaystackService`
- [ ] 9.2 — Install: `pnpm add axios` (for Paystack API calls)
- [ ] 9.3 — Configure Paystack keys in `ConfigService`
- [ ] 9.4 — `POST /paystack/initialize` — initialize payment:
  - Body: `{ saleId, email, amount }`
  - Calls Paystack `/transaction/initialize` → returns payment URL
- [ ] 9.5 — `POST /paystack/webhook` — receive Paystack payment confirmation:
  - Verify HMAC signature (`x-paystack-signature` header)
  - On `charge.success`: mark Sale payment as CONFIRMED, update status
- [ ] 9.6 — `GET /paystack/verify/:reference` — manual verification endpoint
- [ ] 9.7 — Store Paystack reference on `Payment` record
- [ ] 9.8 — Handle edge cases: duplicate webhook events (idempotency check)
- [ ] 9.9 — Test with Paystack sandbox: full payment flow end to end
- [ ] 9.10 — Test webhook signature verification rejects tampered payloads

---

## ✅ Task 10: PDF Receipt Generation — ✅ MOSTLY COMPLETE (Tier 1 MVP)

**Goal:** Generate branded PDF receipts for every completed sale.

**Estimated Time:** 2–3 hours

- [x] 10.1 — Install: `pnpm add pdf-lib`
- [x] 10.2 — Create `ReceiptModule` with `ReceiptService`
- [x] 10.3 — Design receipt template content:
  - Business name, logo, address, phone
  - Sale reference, date, cashier name
  - Line items: product name, qty, unit price, total
  - Subtotal, discount, grand total
  - Payment method and amount tendered
  - Thank you message + return policy
- [x] 10.4 — `GET /sales/:id/receipt` — generate and stream PDF to client
- [ ] 10.5 — `POST /sales/:id/receipt/store` — generate PDF, upload to Cloudinary, save URL on `Receipt` record
- [ ] 10.6 — Receipt regeneration: if already stored, return existing URL
- [ ] 10.7 — `POST /sales/:id/receipt/email` — send receipt PDF to customer email (Task 12 dependency)
- [x] 10.8 — POS UI: after checkout, show "Download Receipt" button on success screen

---

## ✅ Task 11: Cloudinary Image Integration — ✅ COMPLETE (Tier 2 MVP)

**Goal:** Upload and manage product images, business logo, and receipt storage via Cloudinary.

**Estimated Time:** 1–2 hours

- [x] 11.1 — Install: `pnpm add cloudinary multer @nestjs/platform-express`
- [x] 11.2 — Create `CloudinaryModule` (global) with `CloudinaryService`
- [x] 11.3 — Configure Cloudinary with keys from `ConfigService`
- [x] 11.4 — Create `MulterConfig`: memory storage (stream direct to Cloudinary)
- [x] 11.5 — `CloudinaryService.upload(file, folder)` → returns `{ url, publicId }`
- [x] 11.6 — `CloudinaryService.delete(publicId)` → remove image
- [x] 11.7 — `POST /products/:id/images` — upload up to 5 images per product
- [x] 11.8 — `DELETE /products/:id/images/:publicId` — remove specific image
- [x] 11.9 — `PATCH /business/logo` — upload business logo
- [x] 11.10 — Validate file types: jpg, png, webp only. Max size: 5MB
- [x] 11.11 — Store image URLs as string array on `Product` model
- [x] 11.12 — Test: API endpoints stream to Cloudinary and return secure_urls saved to Postgres

---

## ✅ Task 12: BullMQ Background Jobs — ❌ NOT STARTED (Tier 3)

**Goal:** Move all slow or async operations (emails, PDF generation, reports) off the request cycle into background queues.

**Estimated Time:** 3–4 hours

- [ ] 12.1 — Install: `pnpm add @nestjs/bull bull ioredis`
- [ ] 12.2 — Create BullMQ connection config pointing to Redis URL
- [ ] 12.3 — Register `BullModule` globally in `AppModule`
- [ ] 12.4 — Create `EmailQueue`: inject into `SalesModule`, `InventoryModule`
- [ ] 12.5 — Implement email jobs in `EmailProcessor`:
  - `send-receipt` — triggered after sale completes
  - `send-low-stock` — triggered when stock drops below threshold
  - `send-payment-conf` — triggered after Paystack webhook confirms payment
  - `send-po-received` — triggered when purchase order is marked received
- [ ] 12.6 — Implement `PdfQueue` in `PdfProcessor`:
  - `generate-receipt` — async PDF generation + Cloudinary upload
- [ ] 12.7 — Add retry config: 3 retries with exponential backoff
- [ ] 12.8 — Add failed job logging: log to database or console with error details
- [ ] 12.9 — BullMQ Board (optional): install `@bull-board/nestjs` for job monitoring UI
- [ ] 12.10 — Test: complete a sale → receipt PDF generated async → email delivered
- [ ] 12.11 — Test: trigger low stock → email alert received within 30 seconds

---

## ✅ Task 13: Redis Caching Layer — ❌ NOT STARTED (Tier 3)

**Goal:** Cache hot data (stock levels, product list, daily sales) to reduce database load and speed up the POS screen.

**Estimated Time:** 2–3 hours

- [ ] 13.1 — Install: `pnpm add ioredis cache-manager cache-manager-ioredis`
- [ ] 13.2 — Create `RedisModule` (global) with `CacheModule.registerAsync`
- [ ] 13.3 — Cache stock levels per product:
  - Key: `stock:{businessId}:{productId}` | TTL: 60 seconds
- [ ] 13.4 — Cache product list per business:
  - Key: `products:{businessId}:list` | TTL: 5 minutes
- [ ] 13.5 — Cache daily sales summary:
  - Key: `sales:daily:{businessId}:{date}` | TTL: 5 minutes
- [ ] 13.6 — Cache invalidation strategy: clear related keys on write operations
- [ ] 13.7 — Create `CacheService` utility: `get`, `set`, `del`, `delByPattern`
- [ ] 13.8 — Use `@CacheKey()` and `@CacheTTL()` decorators on read endpoints
- [ ] 13.9 — Test: fetch products twice → verify second call hits cache (check logs)
- [ ] 13.10 — Test: update product → verify cache is cleared → next fetch returns updated data

---

## ✅ Task 14: Low Stock Alert System — ✅ MOSTLY COMPLETE

**Goal:** Automatically detect and notify the business owner when stock drops below configured thresholds.

**Estimated Time:** 2–3 hours

- [x] 14.1 — Install: `pnpm add @nestjs/schedule`
- [x] 14.2 — Enable `ScheduleModule` in `AppModule`
- [x] 14.3 — Create `AlertsModule`: `AlertsService`, `AlertsController`
- [x] 14.4 — Low stock check function: query all products where `stockLevel <= threshold`
- [x] 14.5 — Trigger: run low-stock check after every sale (call from `SalesService`)
- [x] 14.6 — Trigger: scheduled daily check at 8:00 AM via `@Cron()`
- [x] 14.7 — On detection: create `Notification` record + enqueue email alert job (Task 12)
- [ ] 14.8 — Email alert content: product name, current stock, threshold, reorder suggestion
- [x] 14.9 — In-app notification: `GET /notifications` — list unread notifications
- [x] 14.10 — `PATCH /notifications/:id/read` — mark notification as read
- [x] 14.11 — `PATCH /notifications/read-all` — mark all as read
- [x] 14.12 — Expiry alert: `@Cron()` daily check for products expiring within 30/14/7 days
- [x] 14.13 — Reorder suggestion: auto-draft `PurchaseOrder` for low-stock products
- [x] 14.14 — Test: set threshold = 10, sell until stock = 9 → verify alert fires

---

## ✅ Task 15: Analytics & Dashboard API — ✅ MOSTLY COMPLETE

**Goal:** Expose all the numbers the dashboard needs — revenue, profit, top products, sales trends.

**Estimated Time:** 3–4 hours

- [x] 15.1 — Create `AnalyticsModule`: `AnalyticsService`, `AnalyticsController`
- [x] 15.2 — `GET /analytics/dashboard` — single endpoint returning all dashboard widgets:
  - `todaySales: { total, count, byMethod }`
  - `weekRevenue`: total this week vs last week (% change)
  - `monthRevenue`: total this month vs last month
  - `grossProfit`: revenue - cost of goods sold
  - `lowStockCount`: number of products below threshold
  - `outOfStockCount`
  - `topProducts`: top 5 by quantity sold (last 30 days)
  - `recentSales`: last 10 sales with customer + total
- [x] 15.3 — `GET /analytics/revenue?period=7d|30d|90d|custom` — revenue chart data (daily breakdown)
- [x] 15.4 — `GET /analytics/products/top` — top selling products with revenue and units sold
- [x] 15.5 — `GET /analytics/products/slow` — slowest moving products
- [x] 15.6 — `GET /analytics/profit` — gross profit report by product and category
- [x] 15.7 — `GET /analytics/stock-valuation` — total stock worth at buying price
- [x] 15.8 — `GET /analytics/cashiers` — sales per staff member
- [x] 15.9 — `GET /analytics/customers` — top customers by spend
- [ ] 15.10 — `GET /analytics/wastage` — expired + damaged stock report
- [ ] 15.11 — Use raw SQL aggregations via `Prisma.$queryRaw` for performance
- [ ] 15.12 — Cache dashboard endpoint in Redis: TTL 5 minutes
- [ ] 15.13 — Test: seed 30 days of sales data → verify all chart data returns correctly

---

## ✅ Task 16: Barcode Scanning (zxing-js) — ❌ NOT STARTED (Tier 2 MVP)

**Goal:** Allow cashiers to scan product barcodes via the device camera to instantly add items to the POS cart.

**Estimated Time:** 2–3 hours

- [ ] 16.1 — Install: `pnpm add @zxing/library` (in `apps/web`)
- [ ] 16.2 — Create `BarcodeScanner` component:
  - Uses `BrowserMultiFormatReader` from `@zxing/library`
  - Accesses device camera via `getUserMedia`
  - Streams video feed into `<video>` element
  - On decode: fires `onScan(barcode: string)` callback
- [ ] 16.3 — Camera permission handling: show prompt if not granted
- [ ] 16.4 — Multi-device support: dropdown to select camera (front/back/external)
- [ ] 16.5 — Error state: handle no camera, permission denied, unsupported browser
- [ ] 16.6 — Integration in POS screen:
  - Open scanner modal → scan barcode → `GET /products?barcode={code}`
  - If found: add to cart automatically
  - If not found: show "Product not found" with manual search fallback
- [ ] 16.7 — Keyboard shortcut: press `F2` or `Ctrl+B` to open scanner modal
- [ ] 16.8 — Test: scan a real barcode → verify product added to cart correctly
- [ ] 16.9 — Test: scan unknown barcode → verify fallback to manual search

---

## ✅ Task 17: Next.js Dashboard UI — ✅ COMPLETE

**Goal:** Build the full admin dashboard — the owner's central view of their business.

**Estimated Time:** 6–8 hours

- [x] 17.1 — Build shared layout: collapsible sidebar, top navigation bar, breadcrumbs
- [x] 17.2 — Sidebar navigation items: Dashboard, Sales / POS, Inventory, Products, Suppliers, Customers, Reports, Settings
- [x] 17.3 — Dashboard overview page (calls `GET /analytics/dashboard`):
  - Stats row: Today's Sales, This Month Revenue, Gross Profit, Low Stock Count
  - Revenue chart: 7-day bar chart (recharts)
  - Top products table: name, units sold, revenue
  - Recent sales feed: last 10 sales
  - Low stock alert panel with badge count
- [x] 17.4 — Inventory page (calls `GET /inventory/stock`):
  - Table: product name, SKU, category, stock level, threshold, status badge
  - Filters: category, status (in-stock, low, out)
  - Stock-in modal: select product, enter quantity and cost
  - Adjustment modal: quantity change + reason
  - Expiry filter tab for pharmacy/food use
- [x] 17.5 — Products page (calls `GET /products`):
  - Grid/list toggle view
  - Add/edit product form: all fields, image uploader, variant manager
  - Bulk import: CSV upload with column mapping and validation preview
  - Delete with confirmation modal
- [x] 17.6 — Suppliers page:
  - Supplier list table
  - Add/edit supplier form
  - Purchase order list per supplier
  - Record payment to supplier
- [x] 17.7 — Customers page:
  - Customer list with purchase history
  - Credit sales outstanding per customer
  - Repayment recording modal
- [x] 17.8 — Notifications panel: bell icon in topbar with unread count badge
- [x] 17.9 — Mobile responsive: sidebar collapses to bottom nav on mobile
- [x] 17.10 — Loading states: skeleton loaders on all data tables
- [x] 17.11 — Empty states: helpful messages when tables are empty

---

## ✅ Task 18: POS / Sales Screen UI — ✅ MOSTLY COMPLETE

**Goal:** Build the point-of-sale screen — fast, keyboard-friendly, works on tablet and desktop.

**Estimated Time:** 4–5 hours

- [x] 18.1 — Two-panel layout: product search/grid (left), cart (right)
- [x] 18.2 — Product search: real-time search-as-you-type (debounced, 300ms)
- [x] 18.3 — Product grid: name, price, stock badge, image thumbnail
- [x] 18.4 — Click product → add to cart. Click again → increase quantity
- [x] 18.5 — Cart panel:
  - Line items: product name, quantity stepper, unit price, line total
  - Remove item button
  - Discount input: toggle % or flat ₦ amount
  - Subtotal, discount line, grand total
- [ ] 18.6 — Barcode scanner button: opens `BarcodeScanner` component (Task 16)
- [x] 18.7 — Payment modal (on Checkout click):
  - Payment method selector: Cash, Transfer, Card, Paystack, Credit
  - Amount tendered input (cash) → change calculator
  - Split payment: add multiple payment lines
  - Paystack option: open payment URL in modal or new tab
- [ ] 18.8 — After checkout: show receipt preview → options: Print, Download PDF, Email to customer
- [x] 18.9 — Keyboard shortcuts for cashier speed:
  - `F1` → focus search bar
  - `F2` → open barcode scanner
  - `Enter` → confirm checkout
  - `Escape` → clear cart (with confirmation)
- [x] 18.10 — New sale button: clear cart instantly after completed sale
- [x] 18.11 — Sales history tab: today’s completed sales in sidebar
- [x] 18.12 — Test: complete a full sale in under 60 seconds from product selection to receipt

---

## ✅ Task 19: Business Rule Validations — ✅ COMPLETE (Tier 1 MVP)

**Goal:** Enforce all domain constraints so the system is consistent and safe from bad data.

**Estimated Time:** 2–3 hours

- [x] 19.1 — Product validations:
  - Selling price must be > buying price (warn if not — don't block)
  - SKU must be unique per business
  - Barcode must be unique globally
  - Cannot delete product with stock movements or sales history
- [x] 19.2 — Sale validations:
  - Cannot sell quantity > available stock
  - Cannot process sale with empty cart
  - Discount cannot exceed subtotal
  - Payment total must equal grand total (warn on underpayment for cash)
- [x] 19.3 — Stock validations:
  - Stock-in quantity must be > 0
  - Adjustment cannot make stock go negative (block, don't warn)
  - Threshold must be >= 0
- [x] 19.4 — Supplier validations:
  - Cannot delete supplier with purchase order history
  - Purchase order must have at least one item
- [x] 19.5 — User validations:
  - Cannot delete the last OWNER account
  - Cannot downgrade own role
- [x] 19.6 — Improve all error messages: specific, actionable, human-readable
- [x] 19.7 — Test all validation rules with edge case inputs

---

## ✅ Task 20: Error Handling & Logging — ✅ COMPLETE (Tier 1 MVP)

**Goal:** Every error is caught, logged, and returned in a consistent format. No unhandled exceptions in production.

**Estimated Time:** 2 hours

- [x] 20.1 — Global `HttpExceptionFilter`: catches all exceptions, returns `{ statusCode, message, error, timestamp }`
- [x] 20.2 — Prisma error handler: `P2002` unique → 409, `P2025` not found → 404
- [x] 20.3 — Request logging middleware: logs method, path, statusCode, duration on every request
- [x] 20.4 — Winston logger: info to console, structured format via `nest-winston`
- [x] 20.5 — 500 errors logged with full stack trace; 4xx logged as warnings
- [x] 20.6 — Middleware applied globally in `AppModule` via `configure()`

---

## ✅ Task 21: API Documentation — ❌ NOT STARTED (Tier 3)

**Goal:** Complete Swagger docs so any developer (or AI agent) can understand and test every endpoint.

**Estimated Time:** 1–2 hours

- [ ] 21.1 — Add `@ApiTags()` to every controller
- [ ] 21.2 — Add `@ApiOperation({ summary })` to every endpoint
- [ ] 21.3 — Add `@ApiResponse()` for all success + error responses
- [ ] 21.4 — Add `@ApiProperty()` with examples on all DTOs and schemas
- [ ] 21.5 — Add `@ApiBearerAuth()` to all protected endpoints
- [ ] 21.6 — Document authentication flow at top of auth controller
- [ ] 21.7 — Test `/api/docs` renders all endpoints correctly
- [ ] 21.8 — Export Postman collection from Swagger JSON
- [ ] 21.9 — Write `README.md`: setup, env vars, running locally, migration commands

---

## ✅ Task 22: Test Suite — ❌ NOT STARTED (Tier 3)

**Goal:** Automated tests covering all critical business logic. Target: 70%+ coverage.

**Estimated Time:** 6–8 hours

- [ ] 22.1 — Install: `pnpm add jest @nestjs/testing supertest ts-jest`
- [ ] 22.2 — Configure jest in `package.json` with test database URL
- [ ] 22.3 — Create test database: separate DB seeded and wiped between test runs
- [ ] 22.4 — Auth tests: register, login, refresh, protected route rejection
- [ ] 22.5 — Product tests: CRUD, duplicate SKU rejection, image upload
- [ ] 22.6 — Inventory tests: stock-in, adjustment, negative stock prevention
- [ ] 22.7 — Sales tests:
  - Complete sale → stock deducted → receipt created
  - Oversell prevention (stock = 2, sell 3 → error)
  - Return → stock restored
- [ ] 22.8 — Paystack tests: webhook signature verification, duplicate event idempotency
- [ ] 22.9 — Analytics tests: verify revenue calculations match seed data
- [ ] 22.10 — Run coverage: `pnpm test:cov` → achieve ≥ 70%

---

## ✅ Task 23: Deployment Configuration — ❌ NOT STARTED (Tier 1 MVP)

**Goal:** The system is containerised, environment-configured, and deployable to Railway in one push.

**Estimated Time:** 3–4 hours

- [ ] 23.1 — Create `apps/api/Dockerfile`:
  - Multi-stage: build stage (install + compile) → prod stage (copy dist only)
  - Non-root user for security
  - `EXPOSE 3001`
- [ ] 23.2 — Create `apps/web/Dockerfile`:
  - Next.js standalone output mode
  - `EXPOSE 3000`
- [ ] 23.3 — Create `docker-compose.yml` (local dev):
  - Services: `api`, `web`, `postgres`, `redis`
  - Volumes for postgres data persistence
  - `.env` file mounting
- [ ] 23.4 — Create `.env.example` with all required variables and descriptions
- [ ] 23.5 — Create `railway.toml` for Railway deployment config
- [ ] 23.6 — Configure production Prisma: `DATABASE_URL` from Railway PostgreSQL plugin
- [ ] 23.7 — Run migrations on deploy: add `prisma migrate deploy` to start command
- [ ] 23.8 — Configure Redis: Railway Redis plugin → set `REDIS_URL`
- [ ] 23.9 — Configure Cloudinary production keys
- [ ] 23.10 — Configure Paystack live keys
- [ ] 23.11 — Configure SendGrid production API key
- [ ] 23.12 — Set `NODE_ENV=production`, disable Swagger in production
- [ ] 23.13 — Setup Sentry for error monitoring (optional but recommended)
- [ ] 23.14 — Test: deploy to Railway staging → run through full sale flow end to end
- [ ] 23.15 — Document deployment steps in README

---

## 📈 Total Estimates

| Scope                                              | Hours        |
| -------------------------------------------------- | ------------ |
| **Full MVP** (all 24 tasks)                        | 62–85 hours  |
| **Minimum viable demo** (Phases 0–2 + Tasks 17–18) | ~38–52 hours |
| **Fastest demo path**                              | ~30–40 hours |

---

## ⚡ Recommended Execution Order (Minimum Demo Path)

To get a working client-facing concept demo as fast as possible, complete only these tasks in order:

1. ~~Task 0 — Turborepo Monorepo Setup~~ ✅
2. ~~Task 1 — NestJS Backend Bootstrap~~ ✅
3. ~~Task 2 — Next.js Frontend Bootstrap~~ ✅
4. ~~Task 3 — Database Schema & Prisma Setup~~ ✅
5. ~~Task 4 — Auth System (JWT + RBAC)~~ ✅
6. ~~Task 5 — Product & Category Module~~ ✅
7. ~~Task 6 — Inventory / Stock Module~~ ✅
8. ~~Task 7 — Sales & POS Module~~ ✅ (mostly)
9. ~~Task 17 — Next.js Dashboard UI~~ ✅
10. ~~Task 18 — POS / Sales Screen UI~~ ✅ (mostly)

**Next up (MVP Tier 1):** 11. Task 19 — Business Rule Validations 12. Task 20 — Error Handling & Logging 13. Task 10 — PDF Receipt Generation 14. Task 23 — Deployment Configuration

> Then add Tasks 9 (Paystack), 16 (Barcode Scanning), and 11 (Cloudinary) to make it shine.

---

_DemolaDevop — Business Automation Systems_
_demoladevop.com · demoladevop@gmail.com · Lagos, Nigeria_
