import { Injectable, NotFoundException } from '@nestjs/common';
import { InventoryRepository } from './inventory.repository';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { StockMovementQueryDto } from './dto/stock-movement-query.dto';
import { StockMovementType } from 'generated/prisma/enums';

@Injectable()
export class InventoryService {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async getLevels(businessId: string) {
    return this.inventoryRepository.findStockRecords({
      where: { product: { businessId } },
    });
  }

  async getHistory(businessId: string, query: StockMovementQueryDto) {
    const { productId, variantId, page, limit } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await this.inventoryRepository.findStockMovements({
      skip,
      take: limit,
      where: {
        product: { businessId },
        ...(productId && { productId }),
        ...(variantId && { variantId }),
      },
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

  async adjustStock(dto: AdjustStockDto, userId: string) {
    const quantityChange =
      dto.type === StockMovementType.IN ? dto.quantity : -dto.quantity;

    if (dto.type === StockMovementType.OUT) {
      const stock = await this.inventoryRepository.findStockRecord(
        dto.variantId
          ? { variantId: dto.variantId }
          : { productId: dto.productId },
      );
      if (!stock || stock.quantity < dto.quantity) {
        throw new NotFoundException('Insufficient stock for this movement');
      }
    }

    return this.inventoryRepository.adjustStock({
      recordWhere: dto.variantId
        ? { variantId: dto.variantId }
        : { productId: dto.productId },
      quantityChange,
      movementData: {
        type: dto.type,
        quantity: dto.quantity,
        reason: dto.reason,
        cost: dto.cost,
        product: { connect: { id: dto.productId } },
        ...(dto.variantId && { variant: { connect: { id: dto.variantId } } }),
        user: { connect: { id: userId } },
        ...(dto.supplierId && {
          supplier: { connect: { id: dto.supplierId } },
        }),
      },
    });
  }
}
