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
}
