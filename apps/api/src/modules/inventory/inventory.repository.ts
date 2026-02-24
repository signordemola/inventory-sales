import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { StockRecord, StockMovement, Prisma } from 'generated/prisma/client';

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findStockRecord(where: Prisma.StockRecordWhereUniqueInput) {
    return this.prisma.stockRecord.findUnique({ where });
  }

  async findStockRecords(params: {
    where?: Prisma.StockRecordWhereInput;
  }): Promise<StockRecord[]> {
    return this.prisma.stockRecord.findMany({
      ...params,
      include: { product: true, variant: true },
    });
  }

  async findStockMovements(params: {
    skip?: number;
    take?: number;
    where?: Prisma.StockMovementWhereInput;
    orderBy?: Prisma.StockMovementOrderByWithRelationInput;
  }): Promise<[StockMovement[], number]> {
    const { skip, take, where, orderBy } = params;
    return Promise.all([
      this.prisma.stockMovement.findMany({
        skip,
        take,
        where,
        orderBy,
        include: { product: true, variant: true, user: true },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);
  }

  async adjustStock(params: {
    recordWhere: Prisma.StockRecordWhereUniqueInput;
    quantityChange: number;
    movementData: Prisma.StockMovementCreateInput;
  }): Promise<StockRecord> {
    const { recordWhere, quantityChange, movementData } = params;

    return this.prisma.$transaction(async (tx) => {
      await tx.stockMovement.create({ data: movementData });

      return tx.stockRecord.upsert({
        where: recordWhere,
        update: { quantity: { increment: quantityChange } },
        create: {
          productId: movementData.product.connect?.id!,
          variantId: movementData.variant?.connect?.id,
          quantity: quantityChange,
        },
      });
    });
  }
}
