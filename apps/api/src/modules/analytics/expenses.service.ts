import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: string, userId: string, data: any) {
    return (this.prisma as any).expense.create({
      data: {
        ...data,
        businessId,
        recordedById: userId,
        date: new Date(data.date),
      },
    });
  }

  async findAll(businessId: string, startDate?: string, endDate?: string) {
    const where: any = { businessId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    return (this.prisma as any).expense.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        recordedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findOne(id: string, businessId: string) {
    const expense = await (this.prisma as any).expense.findFirst({
      where: { id, businessId },
      include: {
        recordedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async update(id: string, businessId: string, data: any) {
    await this.findOne(id, businessId); // verify exists

    const updateData = { ...data };
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }

    return (this.prisma as any).expense.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, businessId: string) {
    await this.findOne(id, businessId); // verify exists
    return (this.prisma as any).expense.delete({
      where: { id },
    });
  }

  async getSummaryByCategory(
    businessId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = { businessId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const expenses = await (this.prisma as any).expense.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
    });

    return expenses.map((e: any) => ({
      category: e.category,
      total: e._sum.amount || 0,
    }));
  }
}
