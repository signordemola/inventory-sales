"use client";

import React, { useState, useMemo } from "react";
import {
  MessageCircle,
  BookOpen,
  Mail,
  Phone,
  Search,
  Zap,
  ArrowRight,
  ShoppingCart,
  Package,
  Users,
  RefreshCcw,
  Wifi,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const categories = [
  {
    icon: ShoppingCart,
    label: "POS & Sales",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Package,
    label: "Inventory",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: RefreshCcw,
    label: "Returns & Voids",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    icon: Users,
    label: "Staff & Roles",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: Wifi,
    label: "Offline Mode",
    color: "text-slate-600",
    bg: "bg-slate-100",
  },
];

const faqs = [
  {
    category: "POS & Sales",
    q: "How do I make a sale?",
    a: "From the POS Terminal, search or browse for products and click to add them to your cart. Select a payment method, enter the tendered amount, then click Complete Sale. The receipt is generated automatically.",
  },
  {
    category: "POS & Sales",
    q: "Can I attach a customer to a sale?",
    a: "Yes. In the Cart panel, click the 'Walk-in Customer' button and search by name, phone, or email. The selected customer appears on the receipt and in your transaction history.",
  },
  {
    category: "POS & Sales",
    q: "The cashier can't access the POS — what's wrong?",
    a: "Cashiers must open a register shift before processing sales. Ask the cashier to go to Shifts › Open Register. An Owner or Manager can do this on their behalf.",
  },
  {
    category: "Returns & Voids",
    q: "How do I void a completed transaction?",
    a: "Navigate to Transactions, find the sale, and click the action menu (⋯). Select 'Void Sale'. This reverses the payment and returns all items to stock. Only Owners and Managers can void transactions.",
  },
  {
    category: "Returns & Voids",
    q: "How do I process a partial return?",
    a: "From the Transactions page, select the sale and click 'Process Return'. Choose the specific items and quantities to return. The system calculates the refund and restocks items automatically.",
  },
  {
    category: "Inventory",
    q: "How do supplier purchase orders work?",
    a: "Go to Suppliers, open a supplier, and create a Purchase Order with the products and quantities needed. When goods arrive, click 'Receive Stock' on the PO and enter the quantities received — inventory updates automatically.",
  },
  {
    category: "Inventory",
    q: "How do I manually adjust stock levels?",
    a: "Go to Inventory › Manual Adjustment. Select the product, choose the adjustment type (add/remove), enter the quantity and a reason. An audit trail entry is created for every adjustment.",
  },
  {
    category: "Staff & Roles",
    q: "What is the difference between roles?",
    a: "OWNER has full access. MANAGER can manage inventory, suppliers, transactions, and view reports but cannot change billing. CASHIER can only use the POS terminal within their own shift.",
  },
  {
    category: "Offline Mode",
    q: "Does the app work without internet?",
    a: "Yes. Sales are saved locally and synced to the server when the connection is restored. The sync status bar at the bottom of the POS screen shows any pending transactions.",
  },
];

export default function SupportPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return faqs.filter((f) => {
      const matchesSearch =
        !q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q);
      const matchesCategory = !activeCategory || f.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  return (
    <div className="flex-1 space-y-10 p-6 md:p-10 bg-slate-50/30 overflow-y-auto">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight font-display">
          Help & Support
        </h1>
        <p className="text-sm font-semibold text-slate-500 mt-1">
          Find answers instantly or reach our team.
        </p>
      </div>

      {/* Hero Search Block */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="px-8 py-10 bg-linear-to-br from-primary/5 via-white to-transparent flex flex-col items-center text-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Search className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              How can we help you?
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Search the knowledge base or browse by topic below.
            </p>
          </div>
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={`Search articles, e.g. "void transaction"…`}
              className="pl-10 h-12 text-sm rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-primary/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Category filter chips */}
        <div className="border-t border-slate-100 px-8 py-5 flex flex-wrap gap-3">
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border ${
              !activeCategory
                ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                : "bg-white text-slate-500 border-slate-200 hover:border-primary/50 hover:text-slate-900"
            }`}
          >
            All Topics
          </button>
          {categories.map((c) => {
            const Icon = c.icon;
            const active = activeCategory === c.label;
            return (
              <button
                key={c.label}
                onClick={() => setActiveCategory(active ? null : c.label)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                  active
                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                    : "bg-white text-slate-500 border-slate-200 hover:border-primary/50 hover:text-slate-900"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${active ? "text-white" : c.color}`}
                />
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            {filtered.length} article{filtered.length !== 1 ? "s" : ""} found
          </h3>
        </div>

        {filtered.length === 0 ? (
          <div className="px-8 py-16 flex flex-col items-center gap-3 text-center">
            <Search className="w-10 h-10 text-slate-200" />
            <p className="font-bold text-slate-400">No results found</p>
            <p className="text-sm text-slate-400 max-w-sm">
              Try a different search term or clear the filters.
            </p>
            <Button
              variant="outline"
              className="mt-2 rounded-xl font-bold"
              onClick={() => {
                setSearch("");
                setActiveCategory(null);
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <Accordion className="divide-y divide-slate-50 px-2">
            {filtered.map((faq, i) => {
              const cat = categories.find((c) => c.label === faq.category);
              return (
                <AccordionItem key={i} value={`faq-${i}`} className="border-0">
                  <AccordionTrigger className="px-6 py-5 hover:bg-slate-50 rounded-lg hover:no-underline transition-colors">
                    <div className="flex items-center gap-4 text-left flex-1 min-w-0 pr-4">
                      <div
                        className={`w-8 h-8 rounded-lg ${cat?.bg ?? "bg-slate-100"} flex items-center justify-center shrink-0`}
                      >
                        {cat && <cat.icon className={`w-4 h-4 ${cat.color}`} />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900">
                          {faq.q}
                        </p>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          {faq.category}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-5">
                    <div className="ml-12 text-sm text-slate-500 leading-relaxed border-l-2 border-primary/20 pl-4">
                      {faq.a}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>

      {/* Contact & Docs Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pb-6">
        {/* Live Chat */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40 p-6 flex flex-col gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-black text-sm text-slate-900">Live Chat</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Mon – Fri · 9am – 6pm WAT
            </p>
          </div>
          <Button className="mt-auto font-bold text-background rounded-xl flex items-center justify-between">
            Start Chat <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Email */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40 p-6 flex flex-col gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Mail className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <p className="font-black text-sm text-slate-900">Email Support</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Response within 24 hours
            </p>
          </div>
          <a
            href="mailto:support@naijastock.io"
            className="mt-auto inline-flex items-center justify-between w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            support@naijastock.io
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </a>
        </div>

        {/* Docs & Phone */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40 p-6 flex flex-col gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <p className="font-black text-sm text-slate-900">Documentation</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Guides for every feature
            </p>
          </div>
          <div className="mt-auto flex flex-col gap-2">
            <a
              href="#"
              className="inline-flex items-center justify-between w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-primary" /> Quick Start
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </a>
            <a
              href="tel:+2348001234567"
              className="inline-flex items-center justify-between w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> +234 800
                NAIJASTOCK
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
