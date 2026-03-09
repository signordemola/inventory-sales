import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay, endOfDay } from 'date-fns';

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all staff with their payroll configuration
   */
  async getStaffPayrollConfigs(businessId: string) {
    const staffUsers = await this.prisma.user.findMany({
      where: { businessId, isActive: true, role: { not: 'OWNER' } },
      select: { id: true, name: true, email: true, role: true },
    });

    if (staffUsers.length === 0) return [];

    const configs = await this.prisma.staffPayroll.findMany({
      where: { userId: { in: staffUsers.map((u) => u.id) } },
    });

    const configMap = new Map(configs.map((c) => [c.userId, c]));

    return staffUsers.map((u) => {
      const config = configMap.get(u.id);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        baseSalary: Number(config?.baseSalary ?? 0),
        commissionRate: Number(config?.commissionRate ?? 0),
        payFrequency: config?.payFrequency ?? 'MONTHLY',
        hasConfig: !!config,
      };
    });
  }

  /**
   * Update or create payroll configuration for a staff member
   */
  async updatePayrollConfig(
    userId: string,
    businessId: string,
    dto: {
      baseSalary: number;
      commissionRate: number;
      payFrequency?: string;
    },
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, businessId },
    });
    if (!user) throw new NotFoundException('Staff member not found');

    return this.prisma.staffPayroll.upsert({
      where: { userId },
      create: {
        userId,
        businessId,
        baseSalary: dto.baseSalary,
        commissionRate: dto.commissionRate,
        payFrequency: dto.payFrequency ?? 'MONTHLY',
      },
      update: {
        baseSalary: dto.baseSalary,
        commissionRate: dto.commissionRate,
        payFrequency: dto.payFrequency ?? 'MONTHLY',
      },
    });
  }

  /**
   * Generate payroll for a period — calculates commission from sales
   */
  async generatePayrollPeriod(
    businessId: string,
    periodStart: string,
    periodEnd: string,
  ) {
    const from = startOfDay(new Date(periodStart));
    const to = endOfDay(new Date(periodEnd));

    const configs = await this.prisma.staffPayroll.findMany({
      where: { businessId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    if (configs.length === 0) {
      return {
        message: 'No payroll configurations found. Set up staff payroll first.',
        records: [],
      };
    }

    const salesByStaff = await this.prisma.sale.groupBy({
      by: ['cashierId'],
      where: {
        businessId,
        status: 'COMPLETED',
        createdAt: { gte: from, lte: to },
        cashierId: { in: configs.map((c) => c.userId) },
      },
      _sum: { total: true },
    });

    const salesMap = new Map<string, number>();
    salesByStaff.forEach((s) => {
      salesMap.set(s.cashierId, Number(s._sum.total ?? 0));
    });

    const createdRecords = [];
    for (const config of configs) {
      const totalSales = salesMap.get(config.userId) ?? 0;
      const commissionEarned = totalSales * Number(config.commissionRate);
      const baseSalary = Number(config.baseSalary);
      const totalPay = baseSalary + commissionEarned;

      const record = await this.prisma.payrollRecord.create({
        data: {
          userId: config.userId,
          businessId,
          periodStart: from,
          periodEnd: to,
          baseSalary,
          commissionEarned,
          totalSales,
          totalPay,
          status: 'DRAFT',
        },
        include: {
          user: { select: { name: true, email: true, role: true } },
        },
      });
      createdRecords.push(record);
    }

    return {
      message: `Generated ${createdRecords.length} payroll record(s) for ${periodStart} → ${periodEnd}`,
      records: createdRecords,
    };
  }

  /**
   * List payroll records
   */
  async getPayrollRecords(businessId: string) {
    return this.prisma.payrollRecord.findMany({
      where: { businessId },
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Approve a payroll record
   */
  async approvePayroll(recordId: string, businessId: string) {
    const record = await this.prisma.payrollRecord.findFirst({
      where: { id: recordId, businessId },
    });
    if (!record) throw new NotFoundException('Payroll record not found');

    return this.prisma.payrollRecord.update({
      where: { id: recordId },
      data: { status: 'APPROVED' },
      include: { user: { select: { name: true } } },
    });
  }

  /**
   * Mark payroll as paid
   */
  async markPaid(recordId: string, businessId: string) {
    const record = await this.prisma.payrollRecord.findFirst({
      where: { id: recordId, businessId },
    });
    if (!record) throw new NotFoundException('Payroll record not found');

    return this.prisma.payrollRecord.update({
      where: { id: recordId },
      data: { status: 'PAID', paidAt: new Date() },
      include: { user: { select: { name: true } } },
    });
  }
}
