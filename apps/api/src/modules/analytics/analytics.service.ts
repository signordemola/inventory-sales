import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  startOfDay,
  endOfDay,
  subDays,
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
} from 'date-fns';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Revenue chart data — daily breakdown for the given period.
   * period: '7d' | '30d' | '90d'
   */
  async getRevenue(businessId: string, period: '7d' | '30d' | '90d' = '7d') {
    const days = period === '90d' ? 90 : period === '30d' ? 30 : 7;
    const now = new Date();
    const from = startOfDay(subDays(now, days - 1));

    const sales = await this.prisma.sale.findMany({
      where: {
        businessId,
        status: 'COMPLETED',
        createdAt: { gte: from },
      },
      select: { total: true, createdAt: true },
    });

    // Build a full day-by-day map so gaps show as 0
    const dayMap: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const key = format(subDays(now, i), 'yyyy-MM-dd');
      dayMap[key] = 0;
    }

    for (const sale of sales) {
      const key = format(sale.createdAt, 'yyyy-MM-dd');
      if (key in dayMap) dayMap[key] += Number(sale.total);
    }

    return Object.entries(dayMap).map(([date, revenue]) => ({
      date,
      label: format(new Date(date), 'MMM d'),
      revenue,
    }));
  }

  /**
   * Top-selling products by quantity sold in the last 30 days.
   */
  async getTopProducts(businessId: string, limit = 10) {
    const from = startOfDay(subDays(new Date(), 30));

    const items = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          businessId,
          status: 'COMPLETED',
          createdAt: { gte: from },
        },
      },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const productIds = items
      .map((i) => i.productId)
      .filter(Boolean) as string[];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true, sellingPrice: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return items.map((item) => ({
      product: productMap.get(item.productId ?? ''),
      unitsSold: item._sum.quantity ?? 0,
      revenue: Number(item._sum.total ?? 0),
    }));
  }

  /**
   * Slowest-moving products — products with the fewest sales in the last 30 days.
   */
  async getSlowProducts(businessId: string, limit = 10) {
    const from = startOfDay(subDays(new Date(), 30));

    // Get all active products
    const allProducts = await this.prisma.product.findMany({
      where: { businessId, isActive: true },
      select: { id: true, name: true, sku: true, sellingPrice: true },
    });

    // Get units sold per product
    const sold = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          businessId,
          status: 'COMPLETED',
          createdAt: { gte: from },
        },
      },
      _sum: { quantity: true },
    });

    const soldMap = new Map(
      sold.map((s) => [s.productId, s._sum.quantity ?? 0]),
    );

    return allProducts
      .map((p) => ({ product: p, unitsSold: soldMap.get(p.id) ?? 0 }))
      .sort((a, b) => a.unitsSold - b.unitsSold)
      .slice(0, limit);
  }

  /**
   * Gross profit report — revenue minus cost of goods, optionally by category.
   */
  async getProfit(businessId: string, period: '7d' | '30d' | '90d' = '30d') {
    const days = period === '90d' ? 90 : period === '30d' ? 30 : 7;
    const from = startOfDay(subDays(new Date(), days));

    const items = await this.prisma.saleItem.findMany({
      where: {
        sale: {
          businessId,
          status: 'COMPLETED',
          createdAt: { gte: from },
        },
      },
      include: {
        product: {
          select: {
            name: true,
            buyingPrice: true,
            categoryId: true,
            category: { select: { name: true } },
          },
        },
      },
    });

    let totalRevenue = 0;
    let totalCogs = 0;

    const byCategoryMap = new Map<
      string,
      { name: string; revenue: number; cogs: number }
    >();

    for (const item of items) {
      const revenue = Number(item.unitPrice) * item.quantity;
      const cogs = Number(item.product.buyingPrice) * item.quantity;
      totalRevenue += revenue;
      totalCogs += cogs;

      const catName = item.product.category?.name ?? 'Uncategorised';
      const catId = item.product.categoryId ?? 'none';
      const existing = byCategoryMap.get(catId) ?? {
        name: catName,
        revenue: 0,
        cogs: 0,
      };
      byCategoryMap.set(catId, {
        ...existing,
        revenue: existing.revenue + revenue,
        cogs: existing.cogs + cogs,
      });
    }

    const byCategory = Array.from(byCategoryMap.values()).map((c) => ({
      category: c.name,
      revenue: c.revenue,
      cogs: c.cogs,
      grossProfit: c.revenue - c.cogs,
      margin: c.revenue > 0 ? ((c.revenue - c.cogs) / c.revenue) * 100 : 0,
    }));

    return {
      totalRevenue,
      totalCogs,
      grossProfit: totalRevenue - totalCogs,
      margin:
        totalRevenue > 0
          ? ((totalRevenue - totalCogs) / totalRevenue) * 100
          : 0,
      byCategory,
    };
  }

  /**
   * Total inventory value at buying price.
   */
  async getStockValuation(businessId: string) {
    const products = await this.prisma.product.findMany({
      where: { businessId, isActive: true },
      include: { stockRecord: true },
    });

    let totalValue = 0;
    let totalUnits = 0;

    const breakdown = products.map((p) => {
      const qty = Number(p.stockRecord?.quantity ?? 0);
      const value = qty * Number(p.buyingPrice);
      totalValue += value;
      totalUnits += qty;
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        quantity: qty,
        buyingPrice: Number(p.buyingPrice),
        value,
      };
    });

    return { totalValue, totalUnits, breakdown };
  }

  /**
   * Sales per cashier — useful for performance tracking.
   */
  async getCashierStats(businessId: string) {
    const from = startOfDay(subDays(new Date(), 30));

    const grouped = await this.prisma.sale.groupBy({
      by: ['cashierId'],
      where: {
        businessId,
        status: 'COMPLETED',
        createdAt: { gte: from },
      },
      _sum: { total: true },
      _count: { id: true },
    });

    const userIds = grouped.map((g) => g.cashierId).filter(Boolean) as string[];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, role: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return grouped.map((g) => ({
      cashier: userMap.get(g.cashierId ?? ''),
      totalRevenue: Number(g._sum.total ?? 0),
      transactionCount: g._count.id,
    }));
  }

  /**
   * Top customers by total spend.
   */
  async getTopCustomers(businessId: string, limit = 10) {
    const grouped = await this.prisma.sale.groupBy({
      by: ['customerId'],
      where: {
        businessId,
        status: 'COMPLETED',
        customerId: { not: null },
      },
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
    });

    const customerIds = grouped
      .map((g) => g.customerId)
      .filter(Boolean) as string[];
    const customers = await this.prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true, phone: true, email: true },
    });

    const customerMap = new Map(customers.map((c) => [c.id, c]));

    return grouped.map((g) => ({
      customer: customerMap.get(g.customerId ?? ''),
      totalSpend: Number(g._sum.total ?? 0),
      purchaseCount: g._count.id,
    }));
  }

  /**
   * Month-over-month revenue comparison.
   */
  async getMonthComparison(businessId: string) {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const [thisMonth, lastMonth] = await Promise.all([
      this.prisma.sale.aggregate({
        where: {
          businessId,
          status: 'COMPLETED',
          createdAt: { gte: thisMonthStart, lte: thisMonthEnd },
        },
        _sum: { total: true },
        _count: { id: true },
      }),
      this.prisma.sale.aggregate({
        where: {
          businessId,
          status: 'COMPLETED',
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
        _sum: { total: true },
        _count: { id: true },
      }),
    ]);

    const current = Number(thisMonth._sum.total ?? 0);
    const previous = Number(lastMonth._sum.total ?? 0);
    const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    return {
      thisMonth: { revenue: current, count: thisMonth._count.id },
      lastMonth: { revenue: previous, count: lastMonth._count.id },
      percentChange: Math.round(change * 10) / 10,
    };
  }

  /**
   * Stockout predictions — estimates days until each product runs out
   * based on 30-day sales velocity.
   */
  async getStockoutPredictions(businessId: string) {
    const thirtyDaysAgo = startOfDay(subDays(new Date(), 30));

    // Get all active products with stock
    const products = await this.prisma.product.findMany({
      where: { businessId, isActive: true },
      include: {
        stockRecord: true,
        preferredSupplier: { select: { id: true, name: true } },
      },
    });

    // Get sales velocity for all products in last 30 days
    const salesData = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          businessId,
          status: 'COMPLETED',
          createdAt: { gte: thirtyDaysAgo },
        },
      },
      _sum: { quantity: true },
    });

    const salesMap = new Map<string, number>();
    salesData.forEach((s) => {
      salesMap.set(s.productId, s._sum.quantity || 0);
    });

    const predictions = products.map((p) => {
      const currentStock = Number(p.stockRecord?.quantity || 0);
      const unitsSold30d = salesMap.get(p.id) || 0;
      const dailyVelocity = unitsSold30d / 30;

      // Days until stockout: current stock / daily velocity
      const daysUntilStockout =
        dailyVelocity > 0
          ? Math.round(currentStock / dailyVelocity)
          : currentStock > 0
            ? 999 // Has stock but no sales — won't run out from sales
            : 0; // No stock and no sales

      // Urgency: red < 3 days, amber < 7 days, green 7+ days
      const urgency =
        daysUntilStockout <= 3
          ? 'critical'
          : daysUntilStockout <= 7
            ? 'warning'
            : 'healthy';

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        currentStock,
        threshold: p.lowStockThreshold,
        unitsSold30d,
        dailyVelocity: Math.round(dailyVelocity * 10) / 10,
        daysUntilStockout,
        urgency,
        preferredSupplier: p.preferredSupplier,
      };
    });

    // Sort by urgency: critical first, then warning, then healthy
    // Within same urgency, sort by fewest days
    return predictions
      .filter((p) => p.daysUntilStockout < 999) // Exclude items with no sales velocity and stock
      .sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);
  }

  /**
   * Dead stock — products with zero sales in N days that still have stock.
   */
  async getDeadStock(businessId: string, daysSinceLastSale = 60) {
    const cutoffDate = startOfDay(subDays(new Date(), daysSinceLastSale));

    const products = await this.prisma.product.findMany({
      where: { businessId, isActive: true },
      include: { stockRecord: true },
    });

    const productsWithStock = products.filter(
      (p) => Number(p.stockRecord?.quantity || 0) > 0,
    );

    if (productsWithStock.length === 0) return [];

    const recentlySold = await this.prisma.saleItem.findMany({
      where: {
        productId: { in: productsWithStock.map((p) => p.id) },
        sale: {
          businessId,
          status: 'COMPLETED',
          createdAt: { gte: cutoffDate },
        },
      },
      select: { productId: true },
      distinct: ['productId'],
    });

    const recentlySoldIds = new Set(recentlySold.map((s) => s.productId));
    const deadStockProducts = productsWithStock.filter(
      (p) => !recentlySoldIds.has(p.id),
    );

    const lastSales = await this.prisma.saleItem.findMany({
      where: {
        productId: { in: deadStockProducts.map((p) => p.id) },
        sale: { businessId, status: 'COMPLETED' },
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['productId'],
      select: { productId: true, createdAt: true },
    });

    const lastSaleMap = new Map(
      lastSales.map((s) => [s.productId, s.createdAt]),
    );

    return deadStockProducts
      .map((p) => {
        const lastSaleDate = lastSaleMap.get(p.id);
        const daysSinceLastSold = lastSaleDate
          ? Math.floor(
              (Date.now() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24),
            )
          : null;

        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          currentStock: Number(p.stockRecord?.quantity || 0),
          stockValue:
            Number(p.stockRecord?.quantity || 0) * Number(p.buyingPrice),
          sellingPrice: Number(p.sellingPrice),
          daysSinceLastSale: daysSinceLastSold,
          lastSaleDate: lastSaleDate || null,
          neverSold: !lastSaleDate,
        };
      })
      .sort((a, b) => {
        if (a.neverSold && !b.neverSold) return -1;
        if (!a.neverSold && b.neverSold) return 1;
        return (b.daysSinceLastSale || 999) - (a.daysSinceLastSale || 999);
      });
  }

  /**
   * Demand forecast — uses 90-day moving average to predict next-week demand.
   */
  async getDemandForecast(businessId: string, forecastDays = 7) {
    const ninetyDaysAgo = startOfDay(subDays(new Date(), 90));

    const salesData = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          businessId,
          status: 'COMPLETED',
          createdAt: { gte: ninetyDaysAgo },
        },
      },
      _sum: { quantity: true },
    });

    if (salesData.length === 0) return [];

    const productIds = salesData.map((s) => s.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { stockRecord: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return salesData
      .map((s) => {
        const product = productMap.get(s.productId);
        if (!product) return null;

        const totalSold90d = s._sum.quantity || 0;
        const dailyAverage = totalSold90d / 90;
        const forecastedDemand = Math.ceil(dailyAverage * forecastDays);
        const currentStock = Number(product.stockRecord?.quantity || 0);
        const surplus = currentStock - forecastedDemand;

        return {
          id: product.id,
          name: product.name,
          sku: product.sku,
          currentStock,
          totalSold90d,
          dailyAverage: Math.round(dailyAverage * 10) / 10,
          forecastedDemand,
          surplus,
          atRisk: surplus < 0,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.surplus - b.surplus);
  }

  /**
   * Peak hours — sales distribution by hour-of-day.
   */
  async getPeakHours(businessId: string, period: '7d' | '30d' | '90d' = '30d') {
    const days = period === '90d' ? 90 : period === '7d' ? 7 : 30;
    const from = startOfDay(subDays(new Date(), days));

    const sales = await this.prisma.sale.findMany({
      where: {
        businessId,
        status: 'COMPLETED',
        createdAt: { gte: from },
      },
      select: { createdAt: true, total: true },
    });

    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${i.toString().padStart(2, '0')}:00`,
      salesCount: 0,
      revenue: 0,
    }));

    for (const sale of sales) {
      const hour = sale.createdAt.getHours();
      hourlyData[hour].salesCount++;
      hourlyData[hour].revenue += Number(sale.total);
    }

    const maxSales = Math.max(...hourlyData.map((h) => h.salesCount));
    const peakHours = hourlyData
      .filter((h) => h.salesCount >= maxSales * 0.8 && h.salesCount > 0)
      .map((h) => h.label);
    const quietHours = hourlyData
      .filter((h) => h.salesCount > 0 && h.salesCount <= maxSales * 0.2)
      .map((h) => h.label);

    return {
      period: `Last ${days} days`,
      totalTransactions: sales.length,
      distribution: hourlyData.filter((h) => h.salesCount > 0),
      peakHours,
      quietHours,
    };
  }
}
