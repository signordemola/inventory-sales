"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Plus, Receipt, Loader2, Trash2, Filter } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import apiClient from "@/lib/axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ExpenseCategory =
  | "RENT"
  | "FUEL"
  | "UTILITIES"
  | "SALARY"
  | "MAINTENANCE"
  | "MARKETING"
  | "OTHER";

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: string;
  date: string;
  description: string | null;
  recordedBy?: { name: string | null; email: string };
}

interface ExpenseSummary {
  category: string;
  total: number;
}

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });

  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ["expenses", dateRange],
    queryFn: async () => {
      const res = await apiClient.get("/analytics/expenses", {
        params: dateRange,
      });
      return res.data;
    },
  });

  const { data: summary } = useQuery<ExpenseSummary[]>({
    queryKey: ["expenses-summary", dateRange],
    queryFn: async () => {
      const res = await apiClient.get("/analytics/expenses/summary", {
        params: dateRange,
      });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/analytics/expenses/${id}`);
    },
    onSuccess: () => {
      toast.success("Expense deleted");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenses-summary"] });
    },
    onError: () => toast.error("Failed to delete expense"),
  });

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 h-full overflow-y-auto bg-white dark:bg-slate-950">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-display">
            Expenses
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Track and manage your operational business expenses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="h-11 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" />
            Record Expense
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 dark:border-slate-800 shadow-none p-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-400 mr-2">
          <Filter className="w-4 h-4" /> Date Range:
        </div>
        <Input
          type="date"
          value={dateRange.startDate}
          onChange={(e) =>
            setDateRange({ ...dateRange, startDate: e.target.value })
          }
          className="w-[150px] h-11 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-primary/20 font-semibold text-slate-700"
        />
        <span className="text-slate-400 font-medium">to</span>
        <Input
          type="date"
          value={dateRange.endDate}
          onChange={(e) =>
            setDateRange({ ...dateRange, endDate: e.target.value })
          }
          className="w-[150px] h-11 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-primary/20 font-semibold text-slate-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Expense History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : !expenses?.length ? (
              <div className="h-[400px] flex flex-col items-center justify-center text-slate-500">
                <Receipt className="w-12 h-12 mb-4 text-slate-200" />
                <p className="font-semibold">
                  No expenses found for this period.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        Date
                      </th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        Category
                      </th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        Description
                      </th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        Recorded By
                      </th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {expenses.map((exp) => (
                      <tr
                        key={exp.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-semibold">
                          {format(new Date(exp.date), "MMM d, yyyy")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-bold border border-indigo-200">
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {exp.description || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#fca5a5] flex items-center justify-center text-[9px] font-black text-white shrink-0">
                              {(
                                exp.recordedBy?.name ||
                                exp.recordedBy?.email ||
                                "?"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-700 text-sm">
                              {exp.recordedBy?.name ||
                                exp.recordedBy?.email ||
                                "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-black text-[15px] text-slate-900">
                          ₦
                          {Number(exp.amount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 w-8 h-8 rounded-lg"
                            onClick={() => {
                              if (confirm("Delete this expense?")) {
                                deleteMutation.mutate(exp.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Category</CardTitle>
            <CardDescription>Breakdown for selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {summary && summary.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={summary}
                    layout="vertical"
                    margin={{ left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis
                      dataKey="category"
                      type="category"
                      width={80}
                      fontSize={12}
                    />
                    <Tooltip
                      formatter={(value: number | string | (number | string)[] | undefined) =>
                        `₦${(Number(value) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                      }
                    />
                    <Bar dataKey="total" fill="#0369a1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">
                No data to chart
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

function ExpenseModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.amount || !formData.date) return;

    try {
      setIsLoading(true);
      await apiClient.post("/analytics/expenses", {
        ...formData,
        amount: Number(formData.amount),
      });
      toast.success("Expense recorded successfully");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenses-summary"] });
      onClose();
      // Reset
      setFormData({
        category: "",
        amount: "",
        date: format(new Date(), "yyyy-MM-dd"),
        description: "",
      });
    } catch {
      toast.error("Failed to record expense");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(val) =>
                  setFormData({ ...formData, category: val || "" })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RENT">Rent</SelectItem>
                  <SelectItem value="FUEL">Fuel / Transport</SelectItem>
                  <SelectItem value="UTILITIES">Utilities</SelectItem>
                  <SelectItem value="SALARY">Salary / Wages</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="MARKETING">Marketing</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                required
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Amount (₦)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Brief details about this expense..."
              className="resize-none h-20"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Expense
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
