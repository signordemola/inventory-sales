import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { SalesRepository } from './sales.repository';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleQueryDto } from './dto/sale-query.dto';
import { ReturnSaleDto } from './dto/return-sale.dto';
import { Sale, SaleItem, Prisma } from 'generated/prisma/client';
import { AlertsService } from 'src/modules/alerts/alerts.service';

// Sale returned from the repository always includes items
type SaleWithItems = Sale & { items: SaleItem[] };

@Injectable()
export class SalesService {
  constructor(
    private readonly salesRepository: SalesRepository,
    private readonly alertsService: AlertsService,
  ) {}

  async findAll(businessId: string, query: SaleQueryDto) {
    const {
      search,
      status,
      customerId,
      cashierId,
      startDate,
      endDate,
      paymentMethod,
      page,
      limit,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SaleWhereInput = {
      businessId,
      ...(status && { status }),
      ...(customerId && { customerId }),
      ...(cashierId && { cashierId }),
      ...(search && {
        reference: { contains: search, mode: 'insensitive' },
      }),
      ...((startDate || endDate) && {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      }),
      ...(paymentMethod && {
        payments: { some: { method: paymentMethod } },
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
    const activeSession = await this.salesRepository.getActiveSession(
      businessId,
      cashierId,
    );
    if (!activeSession) {
      throw new BadRequestException(
        'You must have an open register shift to process sales.',
      );
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        'Cannot process a sale with an empty cart.',
      );
    }

    // Idempotency: if this cuid was already processed (offline sync retry), return existing
    if (dto.cuid) {
      const existing = await this.salesRepository.findByCuid(
        dto.cuid,
        businessId,
      );
      if (existing) {
        throw new ConflictException({
          message: 'Sale already processed',
          existingId: existing.id,
          existingReference: existing.reference,
        });
      }
    }

    const reference = await this.salesRepository.generateReference(businessId);
    const subtotal = dto.items.reduce(
      (acc, item) => acc + item.quantity * item.unitPrice,
      0,
    );
    const total = subtotal - dto.discount + dto.tax;

    if (dto.discount > subtotal) {
      throw new BadRequestException('Discount cannot exceed the subtotal.');
    }

    const amountTendered =
      dto.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
    if (amountTendered < total) {
      throw new BadRequestException(
        `Payment amount (${amountTendered}) does not cover the grand total (${total}).`,
      );
    }

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

    const sale = await this.salesRepository.create({
      data: {
        reference,
        cuid: dto.cuid,
        subtotal,
        total,
        tax: dto.tax,
        discount: dto.discount,
        discountType: dto.discountType,
        status: dto.status,
        notes: dto.notes,
        business: { connect: { id: businessId } },
        cashier: { connect: { id: cashierId } },
        posSession: { connect: { id: activeSession.id } },
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
        // Auto-create CreditSale ledger when payment method is CREDIT
        ...(dto.payments.some((p) => p.method === 'CREDIT') &&
          dto.customerId && {
            creditSale: {
              create: {
                customerId: dto.customerId,
                totalAmount: total,
                amountPaid: 0,
                balance: total,
                ...(dto.creditDueDate && {
                  dueDate: new Date(dto.creditDueDate),
                }),
              },
            },
          }),
      },
      items: dto.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      })),
    });

    // Update the cash drawer's expected balance in real-time for cash payments
    const cashPaymentTotal = dto.payments
      .filter((p) => p.method === 'CASH')
      .reduce((sum, p) => sum + p.amount, 0);

    if (cashPaymentTotal > 0 && activeSession) {
      await this.salesRepository.incrementExpectedCash(
        activeSession.id,
        cashPaymentTotal,
      );
    }

    // Fire-and-forget low stock check after sale completes
    this.alertsService.checkLowStockForBusiness(businessId).catch((err) => {
      console.error('Failed to run low stock check after sale:', err);
    });

    // Fire-and-forget discrepancy check (for offline sync cases where stock might go negative)
    this.alertsService
      .checkStockDiscrepancyAfterSale(businessId, dto.items, reference)
      .catch((err) => {
        console.error('Failed to run stock discrepancy check after sale:', err);
      });

    return sale;
  }

  async returnSale(
    saleId: string,
    businessId: string,
    dto: ReturnSaleDto,
    userId: string,
  ): Promise<Sale> {
    const sale = await this.findOne(saleId, businessId);

    // Validate that the request doesn't return more items than were originally sold
    for (const returnItem of dto.items) {
      // Find the corresponding sale item, making sure to include variants where necessary
      // Assuming sale.items is included in findOne (which it should be via the repository)
      const saleItem = (sale as SaleWithItems).items?.find(
        (i) => i.id === returnItem.saleItemId,
      );

      if (!saleItem) {
        throw new NotFoundException(
          `SaleItem ${returnItem.saleItemId} not found on this sale`,
        );
      }

      if (saleItem.quantity - saleItem.returned < returnItem.quantity) {
        throw new NotFoundException(
          `Cannot return more items than were originally sold.`,
        );
      }
    }

    return this.salesRepository.processReturn(saleId, dto.items, userId);
  }

  async voidSale(
    saleId: string,
    businessId: string,
    userId: string,
  ): Promise<Sale> {
    const sale = await this.findOne(saleId, businessId);

    if (sale.status === 'VOID') {
      throw new BadRequestException('Sale is already voided');
    }

    return this.salesRepository.processVoid(saleId, userId);
  }

  async getOutstandingCredit(businessId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const { items, total } = await this.salesRepository.getOutstandingCredit(
      businessId,
      skip,
      limit,
    );
    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async recordCreditRepayment(
    creditSaleId: string,
    businessId: string,
    amount: number,
    notes?: string,
  ) {
    if (!amount || amount <= 0) {
      throw new BadRequestException(
        'Repayment amount must be greater than zero.',
      );
    }
    const result = await this.salesRepository.recordCreditRepayment(
      creditSaleId,
      businessId,
      amount,
      notes,
    );
    if (!result) {
      throw new NotFoundException('Credit sale not found.');
    }
    return result;
  }

  async getDailySummary(businessId: string, customDate?: string) {
    const date = customDate ? new Date(customDate) : new Date();
    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    return this.salesRepository.getDailySummary(
      businessId,
      startOfDay,
      endOfDay,
    );
  }
}
