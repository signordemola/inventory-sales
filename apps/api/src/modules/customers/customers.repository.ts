import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { Customer, Prisma } from 'generated/prisma/client';

@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params: {
    where?: Prisma.CustomerWhereInput;
    orderBy?: Prisma.CustomerOrderByWithRelationInput;
    include?: Prisma.CustomerInclude;
  }): Promise<Customer[]> {
    return this.prisma.customer.findMany(params);
  }

  async findUnique(
    where: Prisma.CustomerWhereUniqueInput,
    include?: Prisma.CustomerInclude,
  ): Promise<Customer | null> {
    return this.prisma.customer.findUnique({ where, include });
  }

  async create(data: Prisma.CustomerCreateInput): Promise<Customer> {
    return this.prisma.customer.create({ data });
  }

  async update(params: {
    where: Prisma.CustomerWhereUniqueInput;
    data: Prisma.CustomerUpdateInput;
  }): Promise<Customer> {
    const { where, data } = params;
    return this.prisma.customer.update({ where, data });
  }

  async delete(where: Prisma.CustomerWhereUniqueInput): Promise<Customer> {
    return this.prisma.customer.delete({ where });
  }

  // Credit Ledger methods

  async createRepayment(data: Prisma.CreditRepaymentCreateInput) {
    // We execute the repayment creation and the balance update in a transaction
    return this.prisma.$transaction(async (tx) => {
      const repayment = await tx.creditRepayment.create({ data });

      // Update the credit sale amount paid and balance
      const creditSale = await tx.creditSale.findUnique({
        where: { id: data.creditSale.connect.id },
      });

      if (!creditSale) {
        throw new Error('Credit sale not found');
      }

      const newAmountPaid =
        Number(creditSale.amountPaid) + Number(repayment.amount);
      const newBalance = Number(creditSale.totalAmount) - newAmountPaid;

      await tx.creditSale.update({
        where: { id: creditSale.id },
        data: {
          amountPaid: newAmountPaid,
          balance: newBalance,
        },
      });

      return repayment;
    });
  }
}
