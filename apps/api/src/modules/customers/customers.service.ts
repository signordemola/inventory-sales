import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomersRepository } from './customers.repository';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateCreditRepaymentDto } from './dto/create-credit-repayment.dto';
import { Customer } from 'generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { subDays } from 'date-fns';

@Injectable()
export class CustomersService {
  constructor(
    private readonly customersRepository: CustomersRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(businessId: string): Promise<Customer[]> {
    return this.customersRepository.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      include: {
        creditSales: true,
      },
    });
  }

  async findOne(id: string, businessId: string): Promise<Customer> {
    const customer = await this.customersRepository.findUnique(
      { id },
      { creditSales: true },
    );
    if (!customer || customer.businessId !== businessId) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async create(dto: CreateCustomerDto, businessId: string): Promise<Customer> {
    return this.customersRepository.create({
      ...dto,
      business: { connect: { id: businessId } },
    });
  }

  async update(
    id: string,
    dto: UpdateCustomerDto,
    businessId: string,
  ): Promise<Customer> {
    await this.findOne(id, businessId);
    return this.customersRepository.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, businessId: string): Promise<Customer> {
    await this.findOne(id, businessId);
    return this.customersRepository.delete({ id });
  }

  // Credit Ledger Methods

  async createRepayment(dto: CreateCreditRepaymentDto, businessId: string) {
    const customer = await this.customersRepository.findUnique({
      creditSales: {
        some: { id: dto.creditSaleId },
      },
      businessId,
    } as any);

    return this.customersRepository.createRepayment({
      amount: dto.amount,
      notes: dto.notes,
      creditSale: { connect: { id: dto.creditSaleId } },
    });
  }

  // CRM-Lite Methods

  async getCustomerInsights(customerId: string, businessId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, businessId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const sales = await this.prisma.sale.findMany({
      where: {
        customerId,
        businessId,
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        reference: true,
        total: true,
        createdAt: true,
        items: {
          select: {
            quantity: true,
            product: { select: { name: true } },
          },
        },
      },
    });

    const aggregates = await this.prisma.sale.aggregate({
      where: {
        customerId,
        businessId,
        status: 'COMPLETED',
      },
      _sum: { total: true },
      _count: { id: true },
      _avg: { total: true },
    });

    const lastVisit = sales.length > 0 ? sales[0].createdAt : null;
    const daysSinceLastVisit = lastVisit
      ? Math.floor((Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        loyaltyPoints: customer.loyaltyPoints,
        notes: customer.notes,
      },
      lifetimeValue: Number(aggregates._sum.total ?? 0),
      averageOrderValue: Number(aggregates._avg.total ?? 0),
      totalVisits: aggregates._count.id,
      lastVisit,
      daysSinceLastVisit,
      recentPurchases: sales.map((s) => ({
        id: s.id,
        reference: s.reference,
        total: Number(s.total),
        date: s.createdAt,
        itemCount: s.items.reduce((sum, i) => sum + i.quantity, 0),
        topItem: s.items[0]?.product?.name || 'N/A',
      })),
    };
  }

  async getCustomerSegments(businessId: string) {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const sixtyDaysAgo = subDays(now, 60);

    const customers = await this.prisma.customer.findMany({
      where: { businessId },
      include: {
        sales: {
          where: { status: 'COMPLETED' },
          select: { total: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const customerData = customers.map((c) => {
      const totalSpend = c.sales.reduce((sum, s) => sum + Number(s.total), 0);
      const lastPurchase = c.sales.length > 0 ? c.sales[0].createdAt : null;
      const purchaseCount = c.sales.length;

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        totalSpend,
        purchaseCount,
        lastPurchase,
        loyaltyPoints: c.loyaltyPoints,
      };
    });

    const sortedBySpend = [...customerData].sort(
      (a, b) => b.totalSpend - a.totalSpend,
    );
    const top10Percent = Math.max(1, Math.ceil(sortedBySpend.length * 0.1));
    const vipThreshold =
      sortedBySpend.length > 0
        ? sortedBySpend[Math.min(top10Percent - 1, sortedBySpend.length - 1)]
            .totalSpend
        : 0;

    const segments = {
      vip: [] as typeof customerData,
      regular: [] as typeof customerData,
      atRisk: [] as typeof customerData,
      inactive: [] as typeof customerData,
    };

    for (const c of customerData) {
      if (c.totalSpend >= vipThreshold && c.totalSpend > 0) {
        segments.vip.push(c);
      } else if (c.lastPurchase && c.lastPurchase >= thirtyDaysAgo) {
        segments.regular.push(c);
      } else if (
        c.lastPurchase &&
        c.lastPurchase >= sixtyDaysAgo &&
        c.lastPurchase < thirtyDaysAgo
      ) {
        segments.atRisk.push(c);
      } else {
        segments.inactive.push(c);
      }
    }

    return {
      summary: {
        total: customers.length,
        vip: segments.vip.length,
        regular: segments.regular.length,
        atRisk: segments.atRisk.length,
        inactive: segments.inactive.length,
      },
      segments,
    };
  }
}
