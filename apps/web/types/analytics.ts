export interface DateFilterParams {
  startDate?: string;
  endDate?: string;
  range?: "today" | "yesterday" | "7d" | "30d" | "this-month" | "last-month";
}

export interface DashboardStats {
  todayRevenue: number;
  todaySalesCount: number;
  pendingCredit: number;
  lowStockCount: number;
  totalStockValue: number;
  salesTrend: { name: string; revenue: number }[];
  grossProfit: number;
  activeStaffCount: number;
  thisMonthRevenue: number;
  revenueGrowth: number;
  revenueByMethod: { name: string; value: number }[];
  topProducts: {
    id: string;
    name: string;
    quantitySold: number;
    revenue: number;
  }[];
}
