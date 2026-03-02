import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { Product, Prisma } from 'generated/prisma/client';

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
  }): Promise<[Product[], number]> {
    const { skip, take, where, orderBy } = params;
    return Promise.all([
      this.prisma.product.findMany({
        skip,
        take,
        where,
        orderBy,
        include: { category: true, stockRecord: true, variants: true },
      }),
      this.prisma.product.count({ where }),
    ]);
  }

  async findUnique(
    where: Prisma.ProductWhereUniqueInput,
  ): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where,
      include: { category: true, stockRecord: true, variants: true },
    });
  }

  async create(data: Prisma.ProductCreateInput): Promise<Product> {
    return this.prisma.product.create({
      data: {
        ...data,
        stockRecord: { create: { quantity: 0 } },
      },
      include: { category: true, stockRecord: true, variants: true },
    });
  }

  async update(params: {
    where: Prisma.ProductWhereUniqueInput;
    data: Prisma.ProductUpdateInput;
  }): Promise<Product> {
    const { where, data } = params;
    return this.prisma.product.update({
      where,
      data,
      include: { category: true, stockRecord: true, variants: true },
    });
  }

  async delete(where: Prisma.ProductWhereUniqueInput): Promise<Product> {
    return this.prisma.product.update({
      where,
      data: { isActive: false },
    });
  }

  async countStockMovements(productId: string): Promise<number> {
    return this.prisma.stockMovement.count({ where: { productId } });
  }

  async countSaleItems(productId: string): Promise<number> {
    return this.prisma.saleItem.count({ where: { productId } });
  }
}
