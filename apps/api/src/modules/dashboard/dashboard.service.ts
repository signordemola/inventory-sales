import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(businessId: string, user: { id: string; role: string }) {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const sevenDaysAgo = startOfDay(subDays(now, 6));

    // 1. Today's Revenue (Filtered by user if Cashier)
    const salesWhere: any = {
      businessId,
      createdAt: { gte: todayStart, lte: todayEnd },
      status: 'COMPLETED',
    };

    if (user.role === 'CASHIER') {
      salesWhere.cashierId = user.id;
    }

    const todaySales = await this.prisma.sale.aggregate({
      where: salesWhere,
      _sum: { total: true },
      _count: { id: true },
    });

    // 2. Pending Credit
    const pendingCredit = await this.prisma.creditSale.aggregate({
      where: {
        sale: {
          businessId,
          ...(user.role === 'CASHIER' && { cashierId: user.id }),
        },
      },
      _sum: { balance: true },
    });

    // 3. Low Stock Count (All business products for Owner/Manager, only relevant maybe for Cashier too)
    const allProducts = await this.prisma.product.findMany({
      where: { businessId },
      include: { stockRecord: true },
    });

    const lowStockCount = allProducts.filter((p) => {
      const quantity = Number(p.stockRecord?.quantity || 0);
      return quantity <= (p.lowStockThreshold || 0);
    }).length;

    // 4. Total Stock Value
    const stockProducts = await this.prisma.product.findMany({
      where: { businessId },
      include: { stockRecord: true },
    });

    const totalStockValue = stockProducts.reduce((acc, p) => {
      return acc + Number(p.stockRecord?.quantity || 0) * Number(p.buyingPrice);
    }, 0);

    // 5. Real Gross Profit calculation (Today)
    const todayCompletedSaleItems = await this.prisma.saleItem.findMany({
      where: {
        sale: salesWhere,
      },
      include: {
        product: {
          select: { buyingPrice: true },
        },
      },
    });

    const grossProfit = todayCompletedSaleItems.reduce((acc, item) => {
      const margin = Number(item.unitPrice) - Number(item.product.buyingPrice);
      return acc + margin * item.quantity;
    }, 0);

    // 6. Sales Trend (Last 7 Days)
    const salesTrendRaw = await this.prisma.sale.findMany({
      where: {
        businessId,
        createdAt: { gte: sevenDaysAgo },
        status: 'COMPLETED',
        ...(user.role === 'CASHIER' && { cashierId: user.id }),
      },
      select: {
        total: true,
        createdAt: true,
      },
    });

    const trendMap: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const dateStr = format(subDays(now, i), 'EEE');
      trendMap[dateStr] = 0;
    }

    salesTrendRaw.forEach((s) => {
      const day = format(s.createdAt, 'EEE');
      if (trendMap[day] !== undefined) {
        trendMap[day] += Number(s.total);
      }
    });

    const salesTrend = Object.entries(trendMap)
      .map(([name, revenue]) => ({ name, revenue }))
      .reverse();

    // 7. Active Staff Count
    const activeStaffCount = await this.prisma.user.count({
      where: {
        businessId,
        isActive: true,
      },
    });

    return {
      todayRevenue: Number(todaySales._sum.total || 0),
      todaySalesCount: todaySales._count.id,
      pendingCredit: Number(pendingCredit._sum.balance || 0),
      lowStockCount,
      totalStockValue,
      salesTrend,
      grossProfit,
      activeStaffCount,
    };
  }

  async getCashierShift(businessId: string, cashierId: string) {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const salesWhere = {
      businessId,
      cashierId,
      createdAt: { gte: todayStart, lte: todayEnd },
      status: 'COMPLETED' as const,
    };

    // 1. Gross Sales & Transaction Count
    const todaySales = await this.prisma.sale.aggregate({
      where: salesWhere,
      _sum: { total: true },
      _count: { id: true },
    });

    // 2. Cash Expected in Drawer
    // Sum of all payments linked to completed sales TODAY where method is CASH
    const cashPayments = await this.prisma.payment.aggregate({
      where: {
        method: 'CASH',
        sale: salesWhere,
      },
      _sum: { amount: true },
    });

    // 3. Recent Transactions (Last 5)
    const recentSales = await this.prisma.sale.findMany({
      where: { businessId, cashierId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        reference: true,
        total: true,
        status: true,
        createdAt: true,
        items: {
          select: { quantity: true, product: { select: { name: true } } },
        },
      },
    });

    // 4. Low Stock / Out of Stock List (Limit to 10 to keep payload small)
    // Gets active products whose stock is <= lowStockThreshold
    const allProducts = await this.prisma.product.findMany({
      where: { businessId, isActive: true },
      include: { stockRecord: true },
    });

    const lowStockItems = allProducts
      .filter((p) => {
        const qty = Number(p.stockRecord?.quantity || 0);
        return qty <= (p.lowStockThreshold || 0);
      })
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        quantity: Number(p.stockRecord?.quantity || 0),
        threshold: p.lowStockThreshold,
      }))
      .slice(0, 15);

    return {
      grossSales: Number(todaySales._sum.total || 0),
      transactionCount: todaySales._count.id,
      cashDrawerExpected: Number(cashPayments._sum.amount || 0),
      recentSales,
      lowStockItems,
    };
  }
}
