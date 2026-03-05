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

    // For MoM comparison
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

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

    // 8. MoM Revenue
    const thisMonthSales = await this.prisma.sale.aggregate({
      where: {
        businessId,
        createdAt: { gte: thisMonthStart, lte: todayEnd },
        status: 'COMPLETED',
        ...(user.role === 'CASHIER' && { cashierId: user.id }),
      },
      _sum: { total: true },
    });

    const lastMonthSales = await this.prisma.sale.aggregate({
      where: {
        businessId,
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        status: 'COMPLETED',
        ...(user.role === 'CASHIER' && { cashierId: user.id }),
      },
      _sum: { total: true },
    });

    const thisMonthRevenue = Number(thisMonthSales._sum.total || 0);
    const lastMonthRevenue = Number(lastMonthSales._sum.total || 0);
    const revenueGrowth =
      lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 100;

    // Workaround for Prisma's circular type inference bug with nested relational filters in groupBy:
    // First fetch the applicable sale IDs
    const completedSales = await this.prisma.sale.findMany({
      where: {
        businessId,
        status: 'COMPLETED',
        ...(user.role === 'CASHIER' && { cashierId: user.id }),
      },
      select: { id: true },
    });
    const completedSaleIds = completedSales.map((s) => s.id);

    // 9. Revenue by Payment Method (All Time or This Month)
    const paymentSums = await this.prisma.payment.groupBy({
      by: ['method'],
      where: {
        saleId: { in: completedSaleIds },
      },
      _sum: { amount: true },
    });

    const revenueByMethod = paymentSums.map((p) => ({
      name: p.method,
      value: Number(p._sum.amount || 0),
    }));

    const allSaleItems = await this.prisma.saleItem.findMany({
      where: { saleId: { in: completedSaleIds } },
      select: {
        productId: true,
        quantity: true,
        total: true,
        product: {
          select: { name: true },
        },
      },
    });

    const productMap: Record<
      string,
      { id: string; name: string; quantitySold: number; revenue: number }
    > = {};
    for (const item of allSaleItems) {
      if (!productMap[item.productId]) {
        productMap[item.productId] = {
          id: item.productId,
          name: item.product?.name || 'Unknown Product',
          quantitySold: 0,
          revenue: 0,
        };
      }
      productMap[item.productId].quantitySold += item.quantity;
      productMap[item.productId].revenue += Number(item.total || 0);
    }

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    return {
      todayRevenue: Number(todaySales._sum.total || 0),
      todaySalesCount: todaySales._count.id,
      pendingCredit: Number(pendingCredit._sum.balance || 0),
      lowStockCount,
      totalStockValue,
      salesTrend,
      grossProfit,
      activeStaffCount,
      // New Phase 4 stats
      thisMonthRevenue,
      revenueGrowth,
      revenueByMethod,
      topProducts,
    };
  }

  async getCashierShift(businessId: string, cashierId: string) {
    const activeSession = await this.prisma.posSession.findFirst({
      where: { businessId, userId: cashierId, status: 'OPEN' },
      include: { movements: true },
    });

    // We can still fetch low stock warnings regardless of register status
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

    if (!activeSession) {
      return {
        grossSales: 0,
        transactionCount: 0,
        cashDrawerExpected: 0,
        recentSales: [],
        lowStockItems,
        shiftDetails: null,
        drawerMovements: { totalPaidIn: 0, totalPaidOut: 0 },
      };
    }

    const salesWhere = {
      businessId,
      posSessionId: activeSession.id,
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

    // 3. Drawer movements
    let totalPaidIn = 0;
    let totalPaidOut = 0;
    activeSession.movements.forEach((m) => {
      if (m.type === 'PAID_IN') {
        totalPaidIn += Number(m.amount);
      } else {
        totalPaidOut += Number(m.amount);
      }
    });

    // 4. Recent Transactions (Last 10)
    const recentSales = await this.prisma.sale.findMany({
      where: { businessId, posSessionId: activeSession.id },
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

    return {
      grossSales: Number(todaySales._sum.total || 0),
      transactionCount: todaySales._count.id,
      cashDrawerExpected:
        Number(cashPayments._sum.amount || 0) +
        Number(activeSession.startingCash) +
        totalPaidIn -
        totalPaidOut,
      recentSales,
      lowStockItems,
      shiftDetails: {
        id: activeSession.id,
        startingCash: Number(activeSession.startingCash),
        openedAt: activeSession.openedAt,
        status: activeSession.status,
      },
      drawerMovements: { totalPaidIn, totalPaidOut },
    };
  }
}
