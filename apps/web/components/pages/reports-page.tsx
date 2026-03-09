"use client";

import React, { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  FileText,
  Download,
  Receipt,
  TrendingUp,
  DollarSign,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type VATSummary = {
  period: { from: string; to: string };
  taxIdNumber: string;
  taxRate: number;
  totalSalesCount: number;
  totalRevenue: number;
  taxableSales: number;
  exemptSales: number;
  totalDiscount: number;
  totalVATCollected: number;
  netVATPayable: number;
};

type TaxInvoice = {
  invoiceNumber: string;
  saleReference: string;
  date: string;
  customer: string;
  subtotal: number;
  discount: number;
  vat: number;
  vatRate: number;
  total: number;
};

type PnLData = {
  period: { from: string; to: string };
  revenue: {
    total: number;
    byCategory: Array<{
      category: string;
      revenue: number;
      cogs: number;
      grossProfit: number;
    }>;
  };
  costOfGoodsSold: number;
  grossProfit: number;
  grossMargin: number;
  expenses: {
    supplierPayments: number;
    tax: number;
    discounts: number;
  };
  netProfit: number;
};

type CashFlowData = {
  period: { from: string; to: string };
  inflows: {
    byMethod: Array<{ method: string; amount: number }>;
    total: number;
  };
  outflows: {
    items: Array<{
      type: string;
      reference: string;
      supplier: string;
      amount: number;
    }>;
    total: number;
  };
  netCashFlow: number;
  creditOutstanding: number;
};

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"tax" | "pnl" | "cashflow">("tax");
  const [vatSummary, setVatSummary] = useState<VATSummary | null>(null);
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [pnlData, setPnlData] = useState<PnLData | null>(null);
  const [cashFlowData, setCashFlowData] = useState<CashFlowData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const now = new Date();
  const [startDate, setStartDate] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(now.toISOString().split("T")[0]);

  const fetchTaxData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [summaryRes, invoicesRes] = await Promise.all([
        apiClient.get(
          `/analytics/tax/vat-summary?startDate=${startDate}&endDate=${endDate}`,
        ),
        apiClient.get(
          `/analytics/tax/invoices?startDate=${startDate}&endDate=${endDate}`,
        ),
      ]);
      setVatSummary(summaryRes.data);
      setInvoices(invoicesRes.data.invoices || []);
    } catch (e) {
      console.error("Failed to load tax data", e);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  const fetchPnLData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(
        `/analytics/accounting/pnl?startDate=${startDate}&endDate=${endDate}`,
      );
      setPnlData(res.data);
    } catch (e) {
      console.error("Failed to load P&L data", e);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  const fetchCashFlowData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(
        `/analytics/accounting/cashflow?startDate=${startDate}&endDate=${endDate}`,
      );
      setCashFlowData(res.data);
    } catch (e) {
      console.error("Failed to load cash flow data", e);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (activeTab === "tax") fetchTaxData();
    else if (activeTab === "pnl") fetchPnLData();
    else if (activeTab === "cashflow") fetchCashFlowData();
  }, [
    activeTab,
    startDate,
    endDate,
    fetchTaxData,
    fetchPnLData,
    fetchCashFlowData,
  ]);

  const handleExportCSV = async (type: string, period?: string) => {
    setIsExporting(true);
    try {
      const url =
        type === "tax"
          ? `/analytics/tax/export?period=${period || "monthly"}`
          : `/analytics/accounting/export?type=${type}&startDate=${startDate}&endDate=${endDate}`;

      const res = await apiClient.get(url, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${type}-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setIsExporting(false);
    }
  };

  const tabs = [
    { id: "tax" as const, label: "Tax Reports", icon: Receipt },
    { id: "pnl" as const, label: "Profit & Loss", icon: TrendingUp },
    { id: "cashflow" as const, label: "Cash Flow", icon: DollarSign },
  ];

  return (
    <div className="flex-1 space-y-6 p-6 md:p-10 h-full overflow-y-auto bg-white dark:bg-slate-950">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Reports
        </h1>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
          Financial reports, tax compliance &amp; accounting exports.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.id
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date Range Picker — shared across all tabs */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
            />
          </div>
          <div className="flex gap-2 ml-auto">
            {activeTab === "tax" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExportCSV("tax", "monthly")}
                  disabled={isExporting}
                  className="h-10 text-xs font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  {isExporting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Export FIRS
                </Button>
              </>
            )}
            {activeTab === "pnl" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExportCSV("pnl")}
                disabled={isExporting}
                className="h-10 text-xs font-bold border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export P&L
              </Button>
            )}
            {activeTab === "cashflow" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExportCSV("cashflow")}
                disabled={isExporting}
                className="h-10 text-xs font-bold border-violet-300 text-violet-700 hover:bg-violet-50"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export Cash Flow
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </div>
      ) : (
        <>
          {/* Tax Reports Tab */}
          {activeTab === "tax" && vatSummary && (
            <div className="space-y-6">
              {vatSummary.taxIdNumber === "Not Set" && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                  <p className="text-sm font-semibold text-amber-800">
                    TIN not set.{" "}
                    <a
                      href="/settings"
                      className="underline hover:text-amber-900"
                    >
                      Settings → Business Profile
                    </a>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Total Revenue
                    </p>
                    <p className="text-xl font-black text-slate-900 mt-1">
                      {formatCurrency(vatSummary.totalRevenue)}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {vatSummary.totalSalesCount} transactions
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-emerald-200 shadow-sm bg-emerald-50/30">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                      VAT Collected
                    </p>
                    <p className="text-xl font-black text-emerald-700 mt-1">
                      {formatCurrency(vatSummary.totalVATCollected)}
                    </p>
                    <p className="text-xs text-emerald-500 mt-0.5">
                      Rate: {vatSummary.taxRate}%
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Taxable Sales
                    </p>
                    <p className="text-xl font-black text-slate-900 mt-1">
                      {formatCurrency(vatSummary.taxableSales)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-blue-200 shadow-sm bg-blue-50/30">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      Net VAT Payable
                    </p>
                    <p className="text-xl font-black text-blue-700 mt-1">
                      {formatCurrency(vatSummary.netVATPayable)}
                    </p>
                    <p className="text-xs text-blue-500 mt-0.5">
                      TIN: {vatSummary.taxIdNumber}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                    <FileText className="h-4 w-4" /> Tax Invoices
                    <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md ml-2">
                      {invoices.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {invoices.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">
                      No invoices for the selected period.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Invoice #
                            </th>
                            <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Customer
                            </th>
                            <th className="text-right p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Subtotal
                            </th>
                            <th className="text-right p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              VAT
                            </th>
                            <th className="text-right p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map((inv) => (
                            <tr
                              key={inv.invoiceNumber}
                              className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                            >
                              <td className="p-3 font-bold text-blue-700">
                                {inv.invoiceNumber}
                              </td>
                              <td className="p-3 text-slate-600">
                                {new Date(inv.date).toLocaleDateString()}
                              </td>
                              <td className="p-3 font-semibold text-slate-700">
                                {inv.customer}
                              </td>
                              <td className="p-3 text-right text-slate-600">
                                {formatCurrency(inv.subtotal)}
                              </td>
                              <td className="p-3 text-right font-semibold text-emerald-600">
                                {formatCurrency(inv.vat)}
                              </td>
                              <td className="p-3 text-right font-black text-slate-900">
                                {formatCurrency(inv.total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* P&L Tab */}
          {activeTab === "pnl" && pnlData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Revenue
                    </p>
                    <p className="text-xl font-black text-slate-900 mt-1">
                      {formatCurrency(pnlData.revenue.total)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-amber-200 shadow-sm bg-amber-50/30">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                      COGS
                    </p>
                    <p className="text-xl font-black text-amber-700 mt-1">
                      {formatCurrency(pnlData.costOfGoodsSold)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-emerald-200 shadow-sm bg-emerald-50/30">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                      Gross Profit
                    </p>
                    <p className="text-xl font-black text-emerald-700 mt-1">
                      {formatCurrency(pnlData.grossProfit)}
                    </p>
                    <p className="text-xs text-emerald-500 mt-0.5">
                      {pnlData.grossMargin}% margin
                    </p>
                  </CardContent>
                </Card>
                <Card
                  className={`shadow-sm ${pnlData.netProfit >= 0 ? "border-blue-200 bg-blue-50/30" : "border-red-200 bg-red-50/30"}`}
                >
                  <CardContent className="p-4">
                    <p
                      className={`text-[10px] font-bold uppercase tracking-wider ${pnlData.netProfit >= 0 ? "text-blue-600" : "text-red-600"}`}
                    >
                      Net Profit
                    </p>
                    <p
                      className={`text-xl font-black mt-1 ${pnlData.netProfit >= 0 ? "text-blue-700" : "text-red-700"}`}
                    >
                      {formatCurrency(pnlData.netProfit)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue by Category */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-800">
                    Revenue by Category
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="text-right p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Revenue
                        </th>
                        <th className="text-right p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          COGS
                        </th>
                        <th className="text-right p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Gross Profit
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pnlData.revenue.byCategory.map((cat) => (
                        <tr
                          key={cat.category}
                          className="border-b border-slate-50"
                        >
                          <td className="p-3 font-bold text-slate-700">
                            {cat.category}
                          </td>
                          <td className="p-3 text-right text-slate-600">
                            {formatCurrency(cat.revenue)}
                          </td>
                          <td className="p-3 text-right text-amber-600">
                            {formatCurrency(cat.cogs)}
                          </td>
                          <td className="p-3 text-right font-bold text-emerald-600">
                            {formatCurrency(cat.grossProfit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Expenses */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-800">
                    Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Supplier Payments</span>
                    <span className="font-bold text-slate-800">
                      {formatCurrency(pnlData.expenses.supplierPayments)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Tax Collected</span>
                    <span className="font-bold text-slate-800">
                      {formatCurrency(pnlData.expenses.tax)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Discounts Given</span>
                    <span className="font-bold text-slate-800">
                      {formatCurrency(pnlData.expenses.discounts)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Cash Flow Tab */}
          {activeTab === "cashflow" && cashFlowData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-emerald-200 shadow-sm bg-emerald-50/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1.5">
                      <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                        Total Inflow
                      </p>
                    </div>
                    <p className="text-xl font-black text-emerald-700 mt-1">
                      {formatCurrency(cashFlowData.inflows.total)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-red-200 shadow-sm bg-red-50/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1.5">
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                      <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                        Total Outflow
                      </p>
                    </div>
                    <p className="text-xl font-black text-red-700 mt-1">
                      {formatCurrency(cashFlowData.outflows.total)}
                    </p>
                  </CardContent>
                </Card>
                <Card
                  className={`shadow-sm ${cashFlowData.netCashFlow >= 0 ? "border-blue-200 bg-blue-50/30" : "border-red-200 bg-red-50/30"}`}
                >
                  <CardContent className="p-4">
                    <p
                      className={`text-[10px] font-bold uppercase tracking-wider ${cashFlowData.netCashFlow >= 0 ? "text-blue-600" : "text-red-600"}`}
                    >
                      Net Cash Flow
                    </p>
                    <p
                      className={`text-xl font-black mt-1 ${cashFlowData.netCashFlow >= 0 ? "text-blue-700" : "text-red-700"}`}
                    >
                      {formatCurrency(cashFlowData.netCashFlow)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-amber-200 shadow-sm bg-amber-50/30">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                      Credit Outstanding
                    </p>
                    <p className="text-xl font-black text-amber-700 mt-1">
                      {formatCurrency(cashFlowData.creditOutstanding)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Inflows */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4" /> Cash Inflows by Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {cashFlowData.inflows.byMethod.map((m) => (
                    <div
                      key={m.method}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="font-semibold text-slate-700">
                        {m.method}
                      </span>
                      <span className="font-bold text-emerald-700">
                        {formatCurrency(m.amount)}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Outflows */}
              {cashFlowData.outflows.items.length > 0 && (
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-sm font-bold text-red-700 flex items-center gap-2">
                      <ArrowDownRight className="h-4 w-4" /> Cash Outflows
                      (Supplier Payments)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Reference
                          </th>
                          <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Supplier
                          </th>
                          <th className="text-right p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cashFlowData.outflows.items.map((item) => (
                          <tr
                            key={item.reference}
                            className="border-b border-slate-50"
                          >
                            <td className="p-3 font-semibold text-slate-700">
                              {item.reference}
                            </td>
                            <td className="p-3 text-slate-600">
                              {item.supplier}
                            </td>
                            <td className="p-3 text-right font-bold text-red-600">
                              {formatCurrency(item.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
