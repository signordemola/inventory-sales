"use client";

import React, { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Wallet,
  Users,
  CheckCircle,
  Clock,
  Settings,
  Play,
  BadgeCheck,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type StaffConfig = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  baseSalary: number;
  commissionRate: number;
  payFrequency: string;
  hasConfig: boolean;
};

type PayrollRecord = {
  id: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  baseSalary: number;
  commissionEarned: number;
  totalSales: number;
  totalPay: number;
  status: string;
  paidAt: string | null;
  user: {
    name: string | null;
    email: string;
    role: string;
  };
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
  APPROVED: "bg-blue-100 text-blue-700 border-blue-200",
  PAID: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export function PayrollPage() {
  const [activeTab, setActiveTab] = useState<"records" | "settings">("records");
  const [configs, setConfigs] = useState<StaffConfig[]>([]);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingConfig, setEditingConfig] = useState<
    Partial<Record<string, { baseSalary: string; commissionRate: string }>>
  >({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const now = new Date();
  const defaultPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const defaultPeriodEnd = now.toISOString().split("T")[0];
  const [periodStart, setPeriodStart] = useState(defaultPeriodStart);
  const [periodEnd, setPeriodEnd] = useState(defaultPeriodEnd);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [configsRes, recordsRes] = await Promise.all([
        apiClient.get("/payroll/configs"),
        apiClient.get("/payroll/records"),
      ]);
      setConfigs(configsRes.data);
      setRecords(recordsRes.data);
      const editState: typeof editingConfig = {};
      configsRes.data.forEach((c: StaffConfig) => {
        editState[c.id] = {
          baseSalary: c.baseSalary.toString(),
          commissionRate: (c.commissionRate * 100).toString(),
        };
      });
      setEditingConfig(editState);
    } catch (e) {
      console.error("Failed to load payroll data", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSaveConfig = async (userId: string) => {
    const config = editingConfig[userId];
    if (!config) return;
    setActionLoading(userId);
    try {
      await apiClient.patch(`/payroll/configs/${userId}`, {
        baseSalary: parseFloat(config.baseSalary) || 0,
        commissionRate: parseFloat(config.commissionRate) / 100 || 0,
      });
      await fetchAll();
    } catch (e) {
      console.error("Failed to save payroll config", e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await apiClient.post("/payroll/generate", {
        periodStart,
        periodEnd,
      });
      alert(res.data.message);
      await fetchAll();
      setActiveTab("records");
    } catch (e) {
      console.error("Failed to generate payroll", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await apiClient.patch(`/payroll/records/${id}/approve`);
      await fetchAll();
    } catch (e) {
      console.error("Failed to approve", e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPaid = async (id: string) => {
    setActionLoading(id);
    try {
      await apiClient.patch(`/payroll/records/${id}/paid`);
      await fetchAll();
    } catch (e) {
      console.error("Failed to mark paid", e);
    } finally {
      setActionLoading(null);
    }
  };

  const tabs = [
    { id: "records" as const, label: "Payroll Records", icon: Wallet },
    { id: "settings" as const, label: "Staff Config", icon: Settings },
  ];

  return (
    <div className="flex-1 space-y-6 p-6 md:p-10 h-full overflow-y-auto bg-white dark:bg-slate-950">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Payroll
        </h1>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
          Manage staff salaries, commissions & payroll processing.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </div>
      ) : (
        <>
          {/* Payroll Records Tab */}
          {activeTab === "records" && (
            <div className="space-y-5">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Total Records
                    </p>
                    <p className="text-2xl font-black text-slate-900 mt-1">
                      {records.length}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-blue-200 bg-blue-50/30 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      Approved
                    </p>
                    <p className="text-2xl font-black text-blue-700 mt-1">
                      {records.filter((r) => r.status === "APPROVED").length}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-emerald-200 bg-emerald-50/30 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                      Total Disbursed
                    </p>
                    <p className="text-xl font-black text-emerald-700 mt-1">
                      {formatCurrency(
                        records
                          .filter((r) => r.status === "PAID")
                          .reduce((s, r) => s + Number(r.totalPay), 0),
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Generate Payroll Panel */}
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-4 flex flex-wrap items-end gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Period Start
                    </label>
                    <input
                      type="date"
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                      className="h-10 px-3 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 focus:border-blue-400 outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Period End
                    </label>
                    <input
                      type="date"
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                      className="h-10 px-3 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 focus:border-blue-400 outline-none"
                    />
                  </div>
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="h-10 bg-slate-900 hover:bg-slate-700 text-white font-bold text-xs px-5 rounded-lg gap-2"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                    Generate Payroll
                  </Button>
                </CardContent>
              </Card>

              {/* Records Table */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Payroll Records
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {records.length === 0 ? (
                    <div className="p-10 text-center text-sm text-slate-500">
                      No payroll records yet. Generate the first payroll above.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Staff
                            </th>
                            <th className="text-left p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Period
                            </th>
                            <th className="text-right p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Sales
                            </th>
                            <th className="text-right p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Commission
                            </th>
                            <th className="text-right p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Base
                            </th>
                            <th className="text-right p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Total Pay
                            </th>
                            <th className="text-center p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="text-center p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {records.map((r) => (
                            <tr
                              key={r.id}
                              className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                            >
                              <td className="p-3">
                                <p className="font-bold text-slate-800">
                                  {r.user.name || r.user.email}
                                </p>
                                <p className="text-[10px] text-slate-500 uppercase">
                                  {r.user.role}
                                </p>
                              </td>
                              <td className="p-3 text-slate-600 text-xs">
                                {new Date(r.periodStart).toLocaleDateString()} →{" "}
                                {new Date(r.periodEnd).toLocaleDateString()}
                              </td>
                              <td className="p-3 text-right text-slate-600">
                                {formatCurrency(Number(r.totalSales))}
                              </td>
                              <td className="p-3 text-right text-emerald-600 font-bold">
                                {formatCurrency(Number(r.commissionEarned))}
                              </td>
                              <td className="p-3 text-right text-slate-600">
                                {formatCurrency(Number(r.baseSalary))}
                              </td>
                              <td className="p-3 text-right font-black text-slate-900">
                                {formatCurrency(Number(r.totalPay))}
                              </td>
                              <td className="p-3 text-center">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[r.status] || ""}`}
                                >
                                  {r.status}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                {r.status === "DRAFT" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleApprove(r.id)}
                                    disabled={actionLoading === r.id}
                                    className="h-7 text-[10px] font-bold border-blue-300 text-blue-700 hover:bg-blue-50 px-2"
                                  >
                                    {actionLoading === r.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                    )}
                                    Approve
                                  </Button>
                                )}
                                {r.status === "APPROVED" && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleMarkPaid(r.id)}
                                    disabled={actionLoading === r.id}
                                    className="h-7 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2"
                                  >
                                    {actionLoading === r.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <BadgeCheck className="h-3 w-3 mr-1" />
                                    )}
                                    Mark Paid
                                  </Button>
                                )}
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

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-5">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Users className="h-4 w-4" /> Staff Payroll Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {configs.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">
                      No staff members found.
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {configs.map((staff) => {
                        const edit = editingConfig[staff.id] || {
                          baseSalary: "0",
                          commissionRate: "0",
                        };
                        return (
                          <li key={staff.id} className="p-4">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                <p className="font-bold text-slate-800">
                                  {staff.name || staff.email}
                                </p>
                                <p className="text-[10px] uppercase text-slate-500 tracking-wider">
                                  {staff.role}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-3 items-end">
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Base Salary (₦/mo)
                                  </label>
                                  <input
                                    type="number"
                                    value={edit.baseSalary}
                                    onChange={(e) =>
                                      setEditingConfig((prev) => ({
                                        ...prev,
                                        [staff.id]: {
                                          ...edit,
                                          baseSalary: e.target.value,
                                        },
                                      }))
                                    }
                                    className="h-9 px-3 w-32 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 focus:border-blue-400 outline-none"
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Commission Rate (%)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={edit.commissionRate}
                                    onChange={(e) =>
                                      setEditingConfig((prev) => ({
                                        ...prev,
                                        [staff.id]: {
                                          ...edit,
                                          commissionRate: e.target.value,
                                        },
                                      }))
                                    }
                                    className="h-9 px-3 w-28 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 focus:border-blue-400 outline-none"
                                  />
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveConfig(staff.id)}
                                  disabled={actionLoading === staff.id}
                                  className="h-9 text-xs font-bold bg-slate-900 hover:bg-slate-700 text-white px-4"
                                >
                                  {actionLoading === staff.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    "Save"
                                  )}
                                </Button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
