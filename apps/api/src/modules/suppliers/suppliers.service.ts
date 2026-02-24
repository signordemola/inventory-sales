import { Injectable, NotFoundException } from '@nestjs/common';
import { SuppliersRepository } from './suppliers.repository';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Supplier } from 'generated/prisma/client';

@Injectable()
export class SuppliersService {
  constructor(private readonly suppliersRepository: SuppliersRepository) {}

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
    return this.suppliersRepository.delete({ id });
  }
}
