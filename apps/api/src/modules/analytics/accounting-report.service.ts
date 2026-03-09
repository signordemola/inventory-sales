import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay, endOfDay, format } from 'date-fns';

@Injectable()
export class AccountingReportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Profit & Loss — Revenue, COGS, Gross Profit, Expenses (supplier payments)
   */
  async getProfitAndLoss(
    businessId: string,
    startDate: string,
    endDate: string,
  ) {
    const from = startOfDay(new Date(startDate));
    const to = endOfDay(new Date(endDate));

    // Revenue from completed sales
    const salesItems = await this.prisma.saleItem.findMany({
      where: {
        sale: {
          businessId,
          status: 'COMPLETED',
          createdAt: { gte: from, lte: to },
        },
      },
      include: {
        product: {
          select: { buyingPrice: true, category: { select: { name: true } } },
        },
      },
    });

    let totalRevenue = 0;
    let totalCogs = 0;
    const categoryBreakdown = new Map<
      string,
      { revenue: number; cogs: number }
    >();

    for (const item of salesItems) {
      const revenue = Number(item.unitPrice) * item.quantity;
      const cogs = Number(item.product.buyingPrice) * item.quantity;
      totalRevenue += revenue;
      totalCogs += cogs;

      const catName = item.product.category?.name ?? 'Uncategorised';
      const existing = categoryBreakdown.get(catName) ?? {
        revenue: 0,
        cogs: 0,
      };
      categoryBreakdown.set(catName, {
        revenue: existing.revenue + revenue,
        cogs: existing.cogs + cogs,
      });
    }

    // Tax collected
    const taxData = await this.prisma.sale.aggregate({
      where: {
        businessId,
        status: 'COMPLETED',
        createdAt: { gte: from, lte: to },
      },
      _sum: { tax: true, discount: true },
    });

    const totalTax = Number(taxData._sum.tax ?? 0);
    const totalDiscount = Number(taxData._sum.discount ?? 0);

    // Supplier expenses (PO totals received in the period)
    const purchaseOrders = await this.prisma.purchaseOrder.findMany({
      where: {
        supplier: { businessId },
        status: { in: ['RECEIVED', 'PARTIAL'] },
        updatedAt: { gte: from, lte: to },
      },
      select: { total: true },
    });

    const supplierExpenses = purchaseOrders.reduce(
      (sum, po) => sum + Number(po.total),
      0,
    );

    // Operating expenses
    const otherExpensesResult = await (this.prisma as any).expense.aggregate({
      where: {
        businessId,
        date: { gte: from, lte: to },
      },
      _sum: { amount: true },
    });
    const otherExpenses = Number(otherExpensesResult._sum.amount ?? 0);

    const grossProfit = totalRevenue - totalCogs;
    const grossMargin =
      totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netProfit = grossProfit - totalTax - otherExpenses;

    return {
      period: { from: startDate, to: endDate },
      revenue: {
        total: totalRevenue,
        byCategory: Array.from(categoryBreakdown.entries()).map(
          ([category, data]) => ({
            category,
            revenue: data.revenue,
            cogs: data.cogs,
            grossProfit: data.revenue - data.cogs,
          }),
        ),
      },
      costOfGoodsSold: totalCogs,
      grossProfit,
      grossMargin: Math.round(grossMargin * 10) / 10,
      expenses: {
        supplierPayments: supplierExpenses,
        otherExpenses,
        tax: totalTax,
        discounts: totalDiscount,
      },
      netProfit,
    };
  }

  /**
   * Cash Flow — inflows vs outflows by method
   */
  async getCashFlowSummary(
    businessId: string,
    startDate: string,
    endDate: string,
  ) {
    const from = startOfDay(new Date(startDate));
    const to = endOfDay(new Date(endDate));

    // Inflows: payments from completed sales grouped by method
    const completedSales = await this.prisma.sale.findMany({
      where: {
        businessId,
        status: 'COMPLETED',
        createdAt: { gte: from, lte: to },
      },
      select: { id: true },
    });

    const saleIds = completedSales.map((s) => s.id);

    const paymentsByMethod = await this.prisma.payment.groupBy({
      by: ['method'],
      where: { saleId: { in: saleIds } },
      _sum: { amount: true },
    });

    const inflows = paymentsByMethod.map((p) => ({
      method: p.method,
      amount: Number(p._sum.amount ?? 0),
    }));

    const totalInflow = inflows.reduce((sum, p) => sum + p.amount, 0);

    // Outflows: PO costs for received/partial POs
    const purchaseOrders = await this.prisma.purchaseOrder.findMany({
      where: {
        supplier: { businessId },
        status: { in: ['RECEIVED', 'PARTIAL'] },
        updatedAt: { gte: from, lte: to },
      },
      include: { supplier: { select: { name: true } } },
    });

    const outflows = purchaseOrders.map((po) => ({
      type: 'Supplier Payment',
      reference: po.reference,
      supplier: po.supplier.name,
      amount: Number(po.total),
      date: po.updatedAt,
    }));

    // Operating Expenses
    const genericExpenses = await (this.prisma as any).expense.findMany({
      where: {
        businessId,
        date: { gte: from, lte: to },
      },
    });

    for (const exp of genericExpenses) {
      outflows.push({
        type: 'Expense',
        reference: exp.category,
        supplier: exp.description || 'N/A',
        amount: Number(exp.amount),
        date: exp.date,
      });
    }

    const totalOutflow = outflows.reduce((sum, o) => sum + o.amount, 0);

    // Credit receivables
    const creditBalance = await this.prisma.creditSale.aggregate({
      where: {
        sale: {
          businessId,
          createdAt: { gte: from, lte: to },
        },
      },
      _sum: { balance: true },
    });

    return {
      period: { from: startDate, to: endDate },
      inflows: {
        byMethod: inflows,
        total: totalInflow,
      },
      outflows: {
        items: outflows,
        total: totalOutflow,
      },
      netCashFlow: totalInflow - totalOutflow,
      creditOutstanding: Number(creditBalance._sum.balance ?? 0),
    };
  }

  /**
   * Export accounting CSV — P&L or Cash Flow
   */
  async exportAccountingCSV(
    businessId: string,
    type: 'pnl' | 'cashflow',
    startDate: string,
    endDate: string,
  ) {
    if (type === 'pnl') {
      const pnl = await this.getProfitAndLoss(businessId, startDate, endDate);

      const rows = [
        ['Profit & Loss Report'],
        [`Period: ${startDate} to ${endDate}`],
        [],
        ['Category', 'Revenue (₦)', 'COGS (₦)', 'Gross Profit (₦)'],
        ...pnl.revenue.byCategory.map((c) => [
          c.category,
          c.revenue.toFixed(2),
          c.cogs.toFixed(2),
          c.grossProfit.toFixed(2),
        ]),
        [],
        ['Summary', 'Amount (₦)'],
        ['Total Revenue', pnl.revenue.total.toFixed(2)],
        ['Cost of Goods Sold', pnl.costOfGoodsSold.toFixed(2)],
        ['Gross Profit', pnl.grossProfit.toFixed(2)],
        ['Gross Margin', `${pnl.grossMargin}%`],
        ['Supplier Payments', pnl.expenses.supplierPayments.toFixed(2)],
        ['Operating Expenses', pnl.expenses.otherExpenses.toFixed(2)],
        ['Tax Collected', pnl.expenses.tax.toFixed(2)],
        ['Discounts Given', pnl.expenses.discounts.toFixed(2)],
        ['Net Profit', pnl.netProfit.toFixed(2)],
      ];

      return {
        filename: `pnl-report-${startDate}-to-${endDate}.csv`,
        csv: rows.map((r) => r.join(',')).join('\n'),
      };
    } else {
      const cf = await this.getCashFlowSummary(businessId, startDate, endDate);

      const rows = [
        ['Cash Flow Report'],
        [`Period: ${startDate} to ${endDate}`],
        [],
        ['INFLOWS'],
        ['Payment Method', 'Amount (₦)'],
        ...cf.inflows.byMethod.map((m) => [m.method, m.amount.toFixed(2)]),
        ['Total Inflow', cf.inflows.total.toFixed(2)],
        [],
        ['OUTFLOWS'],
        ['Reference', 'Supplier', 'Amount (₦)'],
        ...cf.outflows.items.map((o) => [
          o.reference,
          o.supplier,
          o.amount.toFixed(2),
        ]),
        ['Total Outflow', '', cf.outflows.total.toFixed(2)],
        [],
        ['Net Cash Flow', cf.netCashFlow.toFixed(2)],
        ['Credit Outstanding', cf.creditOutstanding.toFixed(2)],
      ];

      return {
        filename: `cashflow-report-${startDate}-to-${endDate}.csv`,
        csv: rows.map((r) => r.join(',')).join('\n'),
      };
    }
  }
}
