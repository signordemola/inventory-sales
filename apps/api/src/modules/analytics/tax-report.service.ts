import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
} from 'date-fns';

@Injectable()
export class TaxReportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * VAT Summary — total revenue, total VAT collected, exempt sales, net VAT payable
   */
  async getVATSummary(businessId: string, startDate: string, endDate: string) {
    const from = startOfDay(new Date(startDate));
    const to = endOfDay(new Date(endDate));

    const sales = await this.prisma.sale.findMany({
      where: {
        businessId,
        status: 'COMPLETED',
        createdAt: { gte: from, lte: to },
      },
      select: {
        subtotal: true,
        discount: true,
        tax: true,
        total: true,
      },
    });

    let totalRevenue = 0;
    let totalVATCollected = 0;
    let totalDiscount = 0;
    let taxableSales = 0;
    let exemptSales = 0;

    for (const sale of sales) {
      const revenue = Number(sale.total);
      const vat = Number(sale.tax);
      const discount = Number(sale.discount);

      totalRevenue += revenue;
      totalVATCollected += vat;
      totalDiscount += discount;

      if (vat > 0) {
        taxableSales += revenue - vat; // Net of VAT
      } else {
        exemptSales += revenue;
      }
    }

    // Get business tax rate for display
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { taxRate: true, taxIdNumber: true },
    });

    return {
      period: { from: startDate, to: endDate },
      taxIdNumber: business?.taxIdNumber || 'Not Set',
      taxRate: Number(business?.taxRate || 0),
      totalSalesCount: sales.length,
      totalRevenue,
      taxableSales,
      exemptSales,
      totalDiscount,
      totalVATCollected,
      netVATPayable: totalVATCollected, // In simple VAT, output VAT = payable (no input VAT credits tracked yet)
    };
  }

  /**
   * Tax Invoices — all completed sales formatted as FIRS-compliant invoices
   */
  async getTaxInvoices(businessId: string, startDate: string, endDate: string) {
    const from = startOfDay(new Date(startDate));
    const to = endOfDay(new Date(endDate));

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        name: true,
        address: true,
        phone: true,
        email: true,
        taxRate: true,
        taxIdNumber: true,
      },
    });

    const sales = await this.prisma.sale.findMany({
      where: {
        businessId,
        status: 'COMPLETED',
        createdAt: { gte: from, lte: to },
      },
      include: {
        items: {
          include: {
            product: { select: { name: true, sku: true } },
          },
        },
        customer: { select: { name: true, phone: true } },
        cashier: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      business: {
        name: business?.name,
        address: business?.address,
        phone: business?.phone,
        email: business?.email,
        taxIdNumber: business?.taxIdNumber || 'Not Set',
      },
      invoices: sales.map((sale, index) => ({
        invoiceNumber: `INV-${format(sale.createdAt, 'yyyyMMdd')}-${String(index + 1).padStart(4, '0')}`,
        saleReference: sale.reference,
        date: sale.createdAt,
        customer: sale.customer?.name || 'Walk-in Customer',
        customerPhone: sale.customer?.phone || null,
        cashier: sale.cashier?.name,
        items: sale.items.map((item) => ({
          product: item.product.name,
          sku: item.product.sku,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
        })),
        subtotal: Number(sale.subtotal),
        discount: Number(sale.discount),
        vat: Number(sale.tax),
        vatRate: Number(business?.taxRate || 0),
        total: Number(sale.total),
      })),
    };
  }

  /**
   * Export VAT Return — CSV data matching FIRS VAT return format
   */
  async exportVATReturn(businessId: string, period: 'monthly' | 'quarterly') {
    const now = new Date();
    let from: Date;
    let to: Date;
    let periodLabel: string;

    if (period === 'quarterly') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      from = new Date(now.getFullYear(), currentQuarter * 3, 1);
      to = endOfDay(
        endOfMonth(new Date(now.getFullYear(), currentQuarter * 3 + 2, 1)),
      );
      periodLabel = `Q${currentQuarter + 1} ${now.getFullYear()}`;
    } else {
      from = startOfMonth(subMonths(now, 1)); // Previous month
      to = endOfDay(endOfMonth(subMonths(now, 1)));
      periodLabel = format(subMonths(now, 1), 'MMMM yyyy');
    }

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true, taxIdNumber: true, taxRate: true },
    });

    const sales = await this.prisma.sale.findMany({
      where: {
        businessId,
        status: 'COMPLETED',
        createdAt: { gte: from, lte: to },
      },
      include: {
        items: {
          include: {
            product: { select: { name: true, sku: true } },
          },
        },
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Build CSV rows
    const headers = [
      'Invoice Number',
      'Date',
      'Customer',
      'Description',
      'Subtotal (₦)',
      'Discount (₦)',
      'VAT Rate (%)',
      'VAT Amount (₦)',
      'Total (₦)',
    ];

    const rows = sales.map((sale, index) => {
      const description = sale.items
        .map((i) => `${i.product.name} x${i.quantity}`)
        .join('; ');
      return [
        `INV-${format(sale.createdAt, 'yyyyMMdd')}-${String(index + 1).padStart(4, '0')}`,
        format(sale.createdAt, 'yyyy-MM-dd'),
        sale.customer?.name || 'Walk-in Customer',
        description,
        Number(sale.subtotal).toFixed(2),
        Number(sale.discount).toFixed(2),
        Number(business?.taxRate || 0).toString(),
        Number(sale.tax).toFixed(2),
        Number(sale.total).toFixed(2),
      ];
    });

    // Summary row
    const totalSubtotal = sales.reduce((sum, s) => sum + Number(s.subtotal), 0);
    const totalDiscount = sales.reduce((sum, s) => sum + Number(s.discount), 0);
    const totalVAT = sales.reduce((sum, s) => sum + Number(s.tax), 0);
    const totalAmount = sales.reduce((sum, s) => sum + Number(s.total), 0);

    rows.push([]);
    rows.push([
      'TOTAL',
      '',
      '',
      `${sales.length} transactions`,
      totalSubtotal.toFixed(2),
      totalDiscount.toFixed(2),
      '',
      totalVAT.toFixed(2),
      totalAmount.toFixed(2),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

    return {
      filename: `vat-return-${periodLabel.replace(/\s/g, '-').toLowerCase()}.csv`,
      period: periodLabel,
      businessName: business?.name,
      taxIdNumber: business?.taxIdNumber || 'Not Set',
      csv,
    };
  }
}
