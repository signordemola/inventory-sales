import { Injectable, NotFoundException } from '@nestjs/common';
import { SuppliersRepository } from './suppliers.repository';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CreateSupplierPaymentDto } from './dto/create-supplier-payment.dto';
import { Supplier, SupplierPayment } from 'generated/prisma/client';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class SuppliersService {
  constructor(
    private readonly suppliersRepository: SuppliersRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(businessId: string): Promise<Supplier[]> {
    return this.suppliersRepository.findMany({
      where: { businessId },
    });
  }

  async findOne(id: string, businessId: string): Promise<Supplier> {
    const supplier = await this.suppliersRepository.findUnique({ id });
    if (!supplier || supplier.businessId !== businessId) {
      throw new NotFoundException('Supplier not found');
    }
    return supplier;
  }

  async create(dto: CreateSupplierDto, businessId: string): Promise<Supplier> {
    return this.suppliersRepository.create({
      ...dto,
      business: { connect: { id: businessId } },
    });
  }

  async update(
    id: string,
    dto: UpdateSupplierDto,
    businessId: string,
  ): Promise<Supplier> {
    await this.findOne(id, businessId);
    return this.suppliersRepository.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, businessId: string): Promise<Supplier> {
    await this.findOne(id, businessId);

    // Check if supplier has POs
    const poCount = await this.prisma.purchaseOrder.count({
      where: { supplierId: id },
    });

    if (poCount > 0) {
      throw new NotFoundException(
        'Cannot delete supplier with active purchase orders.',
      );
    }

    return this.suppliersRepository.delete({ id });
  }

  async getBalance(id: string, businessId: string) {
    await this.findOne(id, businessId);

    // Aggregate total owed from all POs
    const poResult = await this.prisma.purchaseOrder.aggregate({
      where: { supplierId: id },
      _sum: { total: true },
    });

    // Aggregate total paid from all SupplierPayments
    const paymentResult = await this.prisma.supplierPayment.aggregate({
      where: { supplierId: id },
      _sum: { amount: true },
    });

    const totalOwed = poResult._sum.total ? Number(poResult._sum.total) : 0;
    const totalPaid = paymentResult._sum.amount
      ? Number(paymentResult._sum.amount)
      : 0;
    const balance = totalOwed - totalPaid;

    return { totalOwed, totalPaid, balance };
  }

  async createPayment(
    id: string,
    dto: CreateSupplierPaymentDto,
    businessId: string,
  ): Promise<SupplierPayment> {
    await this.findOne(id, businessId);

    return this.prisma.supplierPayment.create({
      data: {
        supplierId: id,
        amount: dto.amount,
        notes: dto.notes,
      },
    });
  }
}
