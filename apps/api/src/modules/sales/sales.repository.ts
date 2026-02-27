import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { Sale, Prisma, StockMovementType } from 'generated/prisma/client';

@Injectable()
export class SalesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getStock(productId: string, variantId?: string) {
    return this.prisma.stockRecord.findUnique({
      where: variantId ? { variantId } : { productId },
    });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.SaleWhereInput;
    orderBy?: Prisma.SaleOrderByWithRelationInput;
  }): Promise<[Sale[], number]> {
    const { skip, take, where, orderBy } = params;
    return Promise.all([
      this.prisma.sale.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          items: { include: { product: true, variant: true } },
          customer: true,
          cashier: true,
          payments: true,
        },
      }),
      this.prisma.sale.count({ where }),
    ]);
  }

  async findUnique(where: Prisma.SaleWhereUniqueInput): Promise<Sale | null> {
    return this.prisma.sale.findUnique({
      where,
      include: {
        items: { include: { product: true, variant: true } },
        customer: true,
        cashier: true,
        payments: true,
      },
    });
  }

  async create(params: {
    data: Prisma.SaleCreateInput;
    items: { productId: string; variantId?: string; quantity: number }[];
  }): Promise<Sale> {
    const { data, items } = params;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create the sale
      const sale = await tx.sale.create({
        data,
        include: { items: true, payments: true },
      });

      // 2. For each item, update stock and log movement
      for (const item of items) {
        const stockRecordWhere = item.variantId
          ? { variantId: item.variantId }
          : { productId: item.productId };

        // Deduct stock (using upsert for robustness)
        await tx.stockRecord.upsert({
          where: stockRecordWhere,
          update: { quantity: { decrement: item.quantity } },
          create: {
            productId: item.productId,
            variantId: item.variantId,
            quantity: -item.quantity,
          },
        });

        // Log movement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            type: StockMovementType.OUT,
            reason: `Sale: ${sale.reference}`,
            userId: sale.cashierId,
          },
        });
      }

      return sale;
    });
  }

  async updateStatus(
    id: string,
    status: Prisma.EnumSaleStatusFieldUpdateOperationsInput | any,
  ): Promise<Sale> {
    return this.prisma.sale.update({
      where: { id },
      data: { status },
    });
  }

  async processReturn(
    saleId: string,
    returnItems: { saleItemId: string; quantity: number }[],
    userId: string,
  ): Promise<Sale> {
    return this.prisma.$transaction(async (tx) => {
      // Look up original items mapping
      const saleItems = await tx.saleItem.findMany({
        where: { id: { in: returnItems.map((i) => i.saleItemId) }, saleId },
        include: { sale: true },
      });

      const saleItemsMap = new Map(saleItems.map((i) => [i.id, i]));

      let totalReturnedValue = 0;

      for (const returnItem of returnItems) {
        const originalItem = saleItemsMap.get(returnItem.saleItemId);
        if (!originalItem) continue;

        const returnedAmount =
          originalItem.quantity > 0
            ? Number(originalItem.unitPrice) * returnItem.quantity
            : 0;
        totalReturnedValue += returnedAmount;

        // 1. Restock the item
        const stockRecordWhere = originalItem.variantId
          ? { variantId: originalItem.variantId }
          : { productId: originalItem.productId };

        await tx.stockRecord.update({
          where: stockRecordWhere,
          data: { quantity: { increment: returnItem.quantity } },
        });

        // 2. Log movement as ADJUSTMENT (or IN, depending on business requirement, usually IN for returns)
        await tx.stockMovement.create({
          data: {
            productId: originalItem.productId,
            variantId: originalItem.variantId,
            quantity: returnItem.quantity,
            type: StockMovementType.IN,
            reason: `Refund: ${originalItem.sale.reference}`,
            userId,
          },
        });

        // 3. Update SaleItem 'returned' count
        await tx.saleItem.update({
          where: { id: returnItem.saleItemId },
          data: { returned: { increment: returnItem.quantity } },
        });
      }

      // Check if Sale is PARTIALLY_RETURNED or fully RETURNED
      const updatedSaleItems = await tx.saleItem.findMany({
        where: { saleId },
      });
      const totalQuantities = updatedSaleItems.reduce(
        (acc, curr) => acc + curr.quantity,
        0,
      );
      const totalReturned = updatedSaleItems.reduce(
        (acc, curr) => acc + curr.returned,
        0,
      );

      const status =
        totalReturned >= totalQuantities ? 'RETURNED' : 'PARTIALLY_RETURNED';

      // 4. Update the Sale status and record the refund payment (negative payment)
      if (totalReturnedValue > 0) {
        await tx.payment.create({
          data: {
            saleId,
            method: 'CASH', // Defaults to cash refund for MVP
            amount: -totalReturnedValue,
            confirmed: true,
          },
        });
      }

      return tx.sale.update({
        where: { id: saleId },
        data: { status },
        include: {
          items: { include: { product: true, variant: true } },
          customer: true,
          cashier: true,
          payments: true,
        },
      });
    });
  }

  async getDailySummary(businessId: string, startDate: Date, endDate: Date) {
    const sales = await this.prisma.sale.findMany({
      where: {
        businessId,
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        payments: true,
      },
    });

    const totalRevenue = sales.reduce(
      (acc, sale) => acc + Number(sale.total),
      0,
    );
    const saleCount = sales.length;

    const byMethod = sales
      .flatMap((s) => s.payments)
      .reduce(
        (acc, payment) => {
          acc[payment.method] =
            (acc[payment.method] || 0) + Number(payment.amount);
          return acc;
        },
        {} as Record<string, number>,
      );

    return {
      totalRevenue,
      saleCount,
      byMethod,
    };
  }
}
