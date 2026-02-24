import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { Business, Prisma } from 'generated/prisma/client';

@Injectable()
export class BusinessRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUnique(
    where: Prisma.BusinessWhereUniqueInput,
  ): Promise<Business | null> {
    return this.prisma.business.findUnique({ where });
  }

  async update(params: {
    where: Prisma.BusinessWhereUniqueInput;
    data: Prisma.BusinessUpdateInput;
  }): Promise<Business> {
    const { where, data } = params;
    return this.prisma.business.update({ where, data });
  }
}
