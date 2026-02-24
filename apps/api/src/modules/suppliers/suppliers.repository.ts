import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { Supplier, Prisma } from 'generated/prisma/client';

@Injectable()
export class SuppliersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params: {
    where?: Prisma.SupplierWhereInput;
    orderBy?: Prisma.SupplierOrderByWithRelationInput;
  }): Promise<Supplier[]> {
    return this.prisma.supplier.findMany(params);
  }

  async findUnique(
    where: Prisma.SupplierWhereUniqueInput,
  ): Promise<Supplier | null> {
    return this.prisma.supplier.findUnique({ where });
  }

  async create(data: Prisma.SupplierCreateInput): Promise<Supplier> {
    return this.prisma.supplier.create({ data });
  }

  async update(params: {
    where: Prisma.SupplierWhereUniqueInput;
    data: Prisma.SupplierUpdateInput;
  }): Promise<Supplier> {
    const { where, data } = params;
    return this.prisma.supplier.update({ where, data });
  }

  async delete(where: Prisma.SupplierWhereUniqueInput): Promise<Supplier> {
    return this.prisma.supplier.delete({ where });
  }
}
