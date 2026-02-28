import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  async openShift(businessId: string, userId: string, startingCash: number) {
    // Check if the user already has an open shift
    const existingShift = await this.prisma.posSession.findFirst({
      where: { businessId, userId, status: 'OPEN' },
    });

    if (existingShift) {
      throw new BadRequestException(
        'You already have an open shift. Please close it first.',
      );
    }

    return this.prisma.posSession.create({
      data: {
        businessId,
        userId,
        startingCash,
        expectedCash: startingCash, // Initially, expected is the starting float
        status: 'OPEN',
      },
    });
  }

  async closeShift(
    businessId: string,
    userId: string,
    actualCash: number,
    notes?: string,
  ) {
    const shift = await this.prisma.posSession.findFirst({
      where: { businessId, userId, status: 'OPEN' },
      include: {
        sales: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!shift) {
      throw new BadRequestException('No open shift found to close.');
    }

    // Calculate total cash sales strictly tied to this particular shift
    let totalCashSales = 0;
    shift.sales.forEach((sale) => {
      sale.payments.forEach((payment) => {
        if (payment.method === 'CASH') {
          totalCashSales += Number(payment.amount);
        }
      });
    });

    const expectedCash = Number(shift.startingCash) + totalCashSales;
    const variance = actualCash - expectedCash;

    return this.prisma.posSession.update({
      where: { id: shift.id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        expectedCash,
        actualCash,
        variance,
        notes,
      },
    });
  }

  async getCurrentShift(businessId: string, userId: string) {
    return this.prisma.posSession.findFirst({
      where: { businessId, userId, status: 'OPEN' },
      include: {
        sales: {
          where: { status: 'COMPLETED' },
          include: { payments: true },
        },
      },
    });
  }

  async getAllShifts(businessId: string) {
    return this.prisma.posSession.findMany({
      where: { businessId },
      include: {
        user: { select: { name: true, role: true } },
        sales: { select: { id: true } },
      },
      orderBy: { openedAt: 'desc' },
    });
  }

  async getMyShifts(businessId: string, userId: string) {
    return this.prisma.posSession.findMany({
      where: { businessId, userId },
      orderBy: { openedAt: 'desc' },
      take: 30,
    });
  }
}
