# NaijaStock MVP — Step-by-Step Checklist

> **Goal:** Ship a polished, client-ready POS + Inventory system that stands out in the Nigerian market.
> **Architecture:** NestJS API + Next.js Frontend (Turborepo) | Offline-First PWA | PostgreSQL + Dexie.js

---

## Phase 1 — Core Business Logic Fixes _(Week 1)_

These are things a real user will notice in the first 5 minutes.

### 1.1 Cart Discount Input

- [x] Add a discount toggle (% or flat ₦) below the subtotal in `CartPanel`
- [x] Compute: `taxableAmount = subtotal - discount`, `vat = taxableAmount * vatRate`, `total = taxableAmount + vat`
- [x] Pass the computed discount value into `PaymentModal` → `createSaleOffline()`
- [x] Verify the backend `CreateSaleDto` accepts and stores the discount correctly

### 1.2 Dynamic Tax Rate

- [x] Read `Business.taxRate` from the user session (already on the `Business` model)
- [x] Replace hardcoded `const vatRate = 0.075` in `cart-panel.tsx` and `pos-screen.tsx`
- [x] Show "VAT (7.5%)" label dynamically from the rate
- [x] Allow Owner to update `taxRate` from Settings > Preferences

### 1.3 Payment Reference for Card / Transfer

- [x] When payment method is `CARD` or `TRANSFER`, show a "Reference #" text input
- [x] Store the reference on the `Payment` record (add `reference` field if missing)
- [x] Display reference on the Transactions detail view for reconciliation

### 1.4 Cashier Transaction Scoping

- [x] On the Transactions page, detect if the user is a `CASHIER`
- [x] If CASHIER, filter the API query to only return their own sales (`cashierId` = current user)
- [x] Hide the "Staff: All" filter dropdown for cashiers

---

## Phase 2 — POS Flow Completeness _(Week 2)_

### 2.1 Cart Customer Selector

- [x] Wire the "Walk-in Customer" button in `CartPanel` to open a customer search dropdown
- [x] Allow attaching a customer to ANY sale (not just credit sales)
- [x] Pass `customerId` through to the sale creation
- [x] Show customer name on the cart header when selected

### 2.2 Void / Return Actions on Transactions

- [x] Add a "Void" action button on the Transactions table (OWNER + MANAGER only)
- [x] Add a "Process Return" action button (OWNER + MANAGER only)
- [x] Wire void to `POST /sales/:id/void` (created endpoint)
- [x] Wire return to the existing `POST /sales/:id/return` with item selection
- [x] Show confirmation dialogs before void/return

### 2.3 Quick Cash Buttons

- [x] Add preset buttons below the "Amount Tendered" input: ₦500, ₦1000, ₦2000, ₦5000, ₦10000, Exact
- [x] Clicking a button sets the tendered amount instantly
- [x] "Exact" sets amount to the sale total

### 2.4 Export CSV on Transactions

- [x] Wire the "Export CSV" button to hit a backend endpoint (or generate client-side)
- [x] Export columns: Reference, Date, Status, Payment Method, Total, Cashier, Customer
- [x] Name file: `transactions-YYYY-MM-DD.csv`

### 2.5 Sidebar Navigation Fixes

- [x] Add `/shifts` link to sidebar for MANAGER role (icon: `Clock`)
- [x] Verify `/support` page exists (create a placeholder or remove from sidebar)

---

## Phase 3 — Split Payment & Barcode _(Week 3)_

### 3.1 Split Payment UI

- [x] Redesign PaymentModal to allow adding multiple payment rows
- [x] Each row: payment method selector + amount input
- [x] Show "Remaining balance" that updates as rows are filled
- [x] Validate that total of all payment rows equals the sale total
- [x] Send `payments[]` array (already supported by backend)

### 3.2 Barcode Scanning

- [ ] Integrate `@zxing/library` for camera-based barcode scanning
- [ ] Add a scan button / F2 keyboard shortcut on the POS screen
- [ ] On scan: lookup product by barcode → add to cart
- [ ] Handle "product not found" with toast notification
- [ ] Support both EAN-13 and Code-128 formats

### 3.3 Receipt Printing

- [ ] Create a print-optimized receipt layout (80mm width, thermal-friendly)
- [ ] Add "Print Receipt" button next to "Download Receipt" on success screen
- [ ] Use `window.print()` with a hidden receipt component and `@media print` styles
- [ ] Include: business name, address, reference, items, totals, payment method, change, date

---

## Phase 4 — Dashboard & Analytics Polish _(Week 4)_

### 4.1 Owner Dashboard Enhancements

- [x] Add "Top 5 Products" widget (bar chart or ranked list)
- [x] Add "Revenue by Payment Method" breakdown (pie chart)
- [x] Add "Month-over-Month" comparison on revenue card
- [x] Add "Today's Transaction Count" stat card

### 4.2 End-of-Day Z-Report

- [x] Create a Z-Report component accessible from the Cashier dashboard and Transactions page
- [x] Summarize: total sales, sales by payment method, cash expected vs. actual, returns/voids count
- [x] Make it printable with the same thermal-friendly layout
- [x] Link to shift close flow for cashiers

### 4.3 Settings Security Tab

- [ ] Implement the placeholder Security tab in Settings
- [ ] Password change form
- [ ] Active sessions list
- [ ] Two-factor authentication toggle (future-proof the UI)

---

## Phase 5 — Standout Features _(Week 5+)_

> These are the features that make NaijaStock unique and win clients over competitors like Moniepoint and Nomba.

### 5.1 ⭐ True Offline-First (Already Built — Polish It)

- [x] Add offline indicator badge permanently visible in the header/status bar
- [x] Show "X sales pending sync" count in the navigation or POS screen
- [x] Auto-retry sync every 30 seconds when back online
- [x] Handle "failed after 5 attempts" with a user-visible retry button
- [x] Test: disable network, create 10 sales, enable network, verify all sync

### 5.2 ⭐ WhatsApp Receipt Delivery

- [ ] Integrate WhatsApp Business API (or use a service like WATI / Twilio)
- [ ] After sale, if customer has a phone number, show "Send via WhatsApp" button
- [ ] Send a formatted receipt message with sale details and a PDF attachment
- [ ] Track delivery status (sent/delivered/read) — display on transaction detail

### 5.3 ⭐ Smart Restock Suggestions

- [x] Analyze sales velocity per product (units sold / time period)
- [x] When stock < threshold, auto-generate a suggested purchase order
- [x] Show "Suggested Restock" widget on Owner dashboard with 1-click "Create PO"
- [x] Use the existing Suppliers + Purchase Orders modules

### 5.4 ⭐ Daily Business Summary (Push Notification / Email)

- [ ] At end of each day (or shift close), generate a summary digest
- [ ] Include: total revenue, profit, transaction count, top product, low stock alerts
- [ ] Send via email (SendGrid) and/or push notification
- [ ] Make it toggleable per user in Settings > Preferences

### 5.5 ⭐ Installable PWA with Launch to POS

- [x] Verify `manifest.ts` has correct icons, theme color, start_url is `/pos`
- [x] Add an "Install App" prompt banner for first-time users
- [x] Test installation on Chrome Android, Chrome Desktop, Safari iOS
- [x] Ensure the splash screen looks professional with your logo

### 5.6 ⭐ Credit Book with SMS/WhatsApp Reminders

- [ ] Enhance Credit Sales page with overdue highlighting
- [ ] Add "Send Reminder" button per customer with outstanding credit
- [ ] Format: "Hi [Name], you have ₦X outstanding at [Business]. Due: [Date]"
- [ ] Send via SMS (Termii / Africa's Talking) or WhatsApp
- [ ] Log all reminder sends in the AuditLog

### 5.7 ⭐ Profit Margin Insights

- [x] On the Owner dashboard, show profit margin % alongside revenue
- [x] On the Products page, show margin per product (selling price - cost price)
- [x] Add a "Low Margin Alert" — products where margin < 10%
- [x] Show "Top Profit Generators" vs "Top Revenue Generators" comparison

### 5.8 ⭐ Multi-Language Support (Pidgin / Yoruba / Hausa)

- [ ] Set up `next-intl` or a simple i18n system
- [ ] Start with 3 languages: English (default), Pidgin English, Yoruba
- [ ] Translate core POS screen labels and checkout flow
- [ ] Language selector in Settings or user profile
- [ ] _This is a massive differentiator — no Nigerian POS competitor does this_

---

## Phase 6 — Production Hardening _(Before Go-Live)_

### 6.1 Security

- [x] Add rate limiting on auth endpoints (login, register, invite)
- [x] Lock CORS to production frontend domain
- [x] Disable Swagger in production (`NODE_ENV` check)
- [x] Ensure all API routes have proper `@Roles()` guards
- [x] Add request validation on all DTOs (already using class-validator)

### 6.2 Error Handling & UX Polish

- [x] Add global error boundary component
- [x] Add loading skeletons on all data-fetching pages (most already have them)
- [x] Add empty state illustrations for zero-data pages
- [x] Test all forms for validation errors and display
- [x] Test all modals for proper close/cleanup behavior

### 6.3 Performance

- [x] Ensure all images use `next/image` with proper sizing
- [x] Lazy-load heavy components (charts, modals) with `dynamic()`
- [x] Verify Lighthouse score > 90 on POS and Dashboard pages
- [x] Test offline POS with 500+ products in IndexedDB

### 6.4 Deployment

- [ ] Create `Dockerfile` for API (multi-stage: build → production)
- [ ] Configure Next.js for standalone output
- [ ] Set up Railway / Render / Vercel deployment
- [ ] Create `.env.example` with all required variables documented
- [ ] Set up `prisma migrate deploy` in the API start script
- [ ] Configure production database (Supabase / Neon / Railway Postgres)

---

## What Makes NaijaStock Stand Out (Client Pitch Points)

| Feature                        | NaijaStock |  Moniepoint   |     Nomba     | Loyverse |
| ------------------------------ | :--------: | :-----------: | :-----------: | :------: |
| Works without internet         |     ✅     |      ❌       |      ❌       |    ❌    |
| Installable PWA (no app store) |     ✅     |      ❌       |      ❌       |    ❌    |
| Credit sales with due dates    |     ✅     |      ⚠️       |      ❌       |    ❌    |
| WhatsApp receipts              |     🔜     |      ❌       |      ⚠️       |    ❌    |
| Pidgin / Yoruba / Hausa UI     |     🔜     |      ❌       |      ❌       |    ❌    |
| Smart restock suggestions      |     ✅     |      ❌       |      ❌       |    ❌    |
| Role-specific dashboards       |     ✅     |      ❌       |      ❌       |    ⚠️    |
| Cash drawer variance tracking  |     ✅     |      ✅       |      ✅       |    ✅    |
| Profit margin insights         |     ✅     |      ❌       |      ❌       |    ⚠️    |
| Credit book SMS reminders      |     🔜     |      ❌       |      ❌       |    ❌    |
| No hardware required           |     ✅     | ❌ (terminal) | ❌ (terminal) |    ✅    |
| Daily digest notifications     |     🔜     |      ❌       |      ❌       |    ⚠️    |

### The Elevator Pitch

> **NaijaStock** is the only POS system built from the ground up for Nigerian retail.
> It works offline in Oshodi market with bad network. It tracks credit customers.
> It speaks Pidgin. It sends receipts on WhatsApp. And it runs on any phone — no terminal needed.

---

_Last updated: March 4, 2026_
