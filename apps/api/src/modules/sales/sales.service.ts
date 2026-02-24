import { Injectable, NotFoundException } from '@nestjs/common';
import { SalesRepository } from './sales.repository';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleQueryDto } from './dto/sale-query.dto';
import { Sale, Prisma } from 'generated/prisma/client';

@Injectable()
export class SalesService {
  constructor(private readonly salesRepository: SalesRepository) {}

  async findAll(businessId: string, query: SaleQueryDto) {
    const { search, status, customerId, cashierId, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SaleWhereInput = {
      businessId,
      ...(status && { status }),
      ...(customerId && { customerId }),
      ...(cashierId && { cashierId }),
      ...(search && {
        reference: { contains: search, mode: 'insensitive' },
      }),
    };

    const [items, total] = await this.salesRepository.findMany({
      skip,
      take: limit,
      where,
      orderBy: { createdAt: 'desc' },
    });

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, businessId: string): Promise<Sale> {
    const sale = await this.salesRepository.findUnique({ id });
    if (!sale || sale.businessId !== businessId) {
      throw new NotFoundException('Sale not found');
    }
    return sale;
  }

  async create(
    dto: CreateSaleDto,
    businessId: string,
    cashierId: string,
  ): Promise<Sale> {
    const reference = `SALE-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const subtotal = dto.items.reduce(
      (acc, item) => acc + item.quantity * item.unitPrice,
      0,
    );
    const total = subtotal - dto.discount;

    // 1. Check stock availability for all items
    for (const item of dto.items) {
      const stock = await this.salesRepository.getStock(
        item.productId,
        item.variantId,
      );
      if (!stock || stock.quantity < item.quantity) {
        throw new NotFoundException(
          `Insufficient stock for product ${item.productId}`,
        );
      }
    }

    return this.salesRepository.create({
      data: {
        reference,
        subtotal,
        total,
        discount: dto.discount,
        discountType: dto.discountType,
        status: dto.status,
        notes: dto.notes,
        business: { connect: { id: businessId } },
        cashier: { connect: { id: cashierId } },
        ...(dto.customerId && {
          customer: { connect: { id: dto.customerId } },
        }),
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
        payments: {
          create: dto.payments.map((payment) => ({
            method: payment.method,
            amount: payment.amount,
            reference: payment.reference,
            confirmed: payment.confirmed,
          })),
        },
      },
      items: dto.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      })),
    });
  }
}
