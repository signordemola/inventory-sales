import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DrawerMovementType } from 'generated/prisma/enums';

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
        movements: true,
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

    // Factor in drawer movements (paid-in adds, paid-out subtracts)
    let totalPaidIn = 0;
    let totalPaidOut = 0;
    shift.movements.forEach((m) => {
      if (m.type === 'PAID_IN') {
        totalPaidIn += Number(m.amount);
      } else {
        totalPaidOut += Number(m.amount);
      }
    });

    const expectedCash =
      Number(shift.startingCash) + totalCashSales + totalPaidIn - totalPaidOut;
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

  async recordDrawerMovement(
    businessId: string,
    userId: string,
    type: DrawerMovementType,
    amount: number,
    reason: string,
  ) {
    const shift = await this.prisma.posSession.findFirst({
      where: { businessId, userId, status: 'OPEN' },
    });

    if (!shift) {
      throw new BadRequestException(
        'No open shift found. Open a register first.',
      );
    }

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero.');
    }

    // Create the movement and update expectedCash atomically
    const increment = type === 'PAID_IN' ? amount : -amount;

    const [movement] = await this.prisma.$transaction([
      this.prisma.cashDrawerMovement.create({
        data: {
          sessionId: shift.id,
          userId,
          type,
          amount,
          reason,
        },
      }),
      this.prisma.posSession.update({
        where: { id: shift.id },
        data: {
          expectedCash: { increment },
        },
      }),
    ]);

    return movement;
  }

  async getZReport(businessId: string, userId: string, shiftId?: string) {
    const shift = await this.prisma.posSession.findFirst({
      where: shiftId ? { businessId, id: shiftId } : { businessId, userId },
      orderBy: { openedAt: 'desc' },
      include: {
        sales: {
          include: {
            payments: true,
            items: {
              include: { product: { select: { name: true } } },
            },
          },
        },
        movements: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { name: true } } },
        },
      },
    });

    if (!shift) {
      throw new BadRequestException('No shift found.');
    }

    // Sales breakdown by payment method and return/void counts
    const salesByMethod: Record<string, number> = {};
    let totalCashSales = 0;
    let totalRevenue = 0;
    let voidsCount = 0;
    let returnsCount = 0;

    shift.sales.forEach((sale) => {
      if (sale.status === 'COMPLETED') {
        totalRevenue += Number(sale.total);
        sale.payments.forEach((p) => {
          salesByMethod[p.method] =
            (salesByMethod[p.method] || 0) + Number(p.amount);
          if (p.method === 'CASH') {
            totalCashSales += Number(p.amount);
          }
        });
      } else if (sale.status === 'VOID') {
        voidsCount++;
      } else if (sale.status === 'RETURNED') {
        returnsCount++;
      }
    });

    // Drawer movements
    let totalPaidIn = 0;
    let totalPaidOut = 0;
    shift.movements.forEach((m) => {
      if (m.type === 'PAID_IN') {
        totalPaidIn += Number(m.amount);
      } else {
        totalPaidOut += Number(m.amount);
      }
    });

    const expectedCash =
      Number(shift.startingCash) + totalCashSales + totalPaidIn - totalPaidOut;

    return {
      shiftId: shift.id,
      status: shift.status,
      openedAt: shift.openedAt,
      closedAt: shift.closedAt,
      startingCash: Number(shift.startingCash),
      totalRevenue,
      transactionCount: shift.sales.filter((s) => s.status === 'COMPLETED')
        .length,
      voidsCount,
      returnsCount,
      salesByMethod,
      totalPaidIn,
      totalPaidOut,
      movements: shift.movements.map((m) => ({
        id: m.id,
        type: m.type,
        amount: Number(m.amount),
        reason: m.reason,
        createdAt: m.createdAt,
        userName: m.user.name,
      })),
      expectedCash,
      actualCash: shift.actualCash ? Number(shift.actualCash) : null,
      variance: shift.variance ? Number(shift.variance) : null,
    };
  }

  async getCurrentShift(businessId: string, userId: string) {
    return this.prisma.posSession.findFirst({
      where: { businessId, userId, status: 'OPEN' },
      include: {
        sales: {
          where: { status: 'COMPLETED' },
          include: { payments: true },
        },
        movements: true,
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
