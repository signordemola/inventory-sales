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
}
