import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';
import {
  Prisma,
  PurchaseOrderStatus,
  StockMovementType,
  PurchaseOrder,
} from 'generated/prisma/client';

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePurchaseOrderDto, businessId: string) {
    // Guard: PO must have at least one item
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        'A purchase order must have at least one item.',
      );
    }

    // 1. Verify supplier exists and belongs to business
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: dto.supplierId },
    });

    if (!supplier || supplier.businessId !== businessId) {
      throw new NotFoundException('Supplier not found');
    }

    // 2. Calculate Total
    const total = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.cost,
      0,
    );

    // Generate a reference
    const timestamp = new Date().getTime().toString().slice(-6);
    const reference = `PO-${timestamp}`;

    // 3. Create PO with items
    return this.prisma.purchaseOrder.create({
      data: {
        reference,
        supplierId: dto.supplierId,
        expectedDelivery: dto.expectedDelivery
          ? new Date(dto.expectedDelivery)
          : null,
        notes: dto.notes,
        total: total,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            cost: item.cost,
          })),
        },
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    });
  }

  async findAll(businessId: string): Promise<PurchaseOrder[]> {
    return this.prisma.purchaseOrder.findMany({
      where: { supplier: { businessId } },
      include: { supplier: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, businessId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: { product: true },
        },
      },
    });

    if (!po || po.supplier.businessId !== businessId) {
      throw new NotFoundException('Purchase Order not found');
    }

    return po;
  }

  async receiveStock(
    id: string,
    dto: ReceivePurchaseOrderDto,
    businessId: string,
    userId: string,
  ) {
    const po = await this.findOne(id, businessId);

    if (po.status === PurchaseOrderStatus.RECEIVED) {
      throw new BadRequestException('Purchase order is already fully received');
    }

    if (po.status === PurchaseOrderStatus.CANCELLED) {
      throw new BadRequestException(
        'Cannot receive items for a cancelled purchase order',
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      let fullyReceivedCount = 0;

      for (const receiveItem of dto.items) {
        const orderItem = po.items.find((i) => i.id === receiveItem.id);

        if (!orderItem) {
          throw new BadRequestException(
            `Order item ${receiveItem.id} not found in this Purchase Order`,
          );
        }

        const remainingToReceive = orderItem.quantity - orderItem.received;

        if (receiveItem.receivedQty > remainingToReceive) {
          throw new BadRequestException(
            `Cannot receive ${receiveItem.receivedQty}. Only ${remainingToReceive} remaining for item ${receiveItem.id}.`,
          );
        }

        const newReceivedTotal = orderItem.received + receiveItem.receivedQty;

        // 1. Update the order item's received amount
        await tx.purchaseOrderItem.update({
          where: { id: orderItem.id },
          data: { received: newReceivedTotal },
        });

        if (newReceivedTotal === orderItem.quantity) {
          fullyReceivedCount++;
        } else if (orderItem.received === orderItem.quantity) {
          // It was already fully received before this request
          fullyReceivedCount++;
        }

        // 2. Create StockMovement IN
        await tx.stockMovement.create({
          data: {
            productId: orderItem.productId,
            type: StockMovementType.IN,
            quantity: receiveItem.receivedQty,
            cost: orderItem.cost,
            reason: `PO Received: ${po.reference}`,
            userId: userId,
            supplierId: po.supplierId,
          },
        });

        // 3. Update the global Stock Record
        await tx.stockRecord.upsert({
          where: { productId: orderItem.productId },
          create: {
            productId: orderItem.productId,
            quantity: receiveItem.receivedQty,
          },
          update: {
            quantity: { increment: receiveItem.receivedQty },
          },
        });
      }

      // 4. Update PO Status
      // If the number of fully received items equals the total items on the PO, it's RECEIVED. Otherwise PARTIAL.
      // Need to re-query to be safe, or just calculate if all items are fully received.

      const allUpdatedItems = await tx.purchaseOrderItem.findMany({
        where: { orderId: po.id },
      });

      const allFulfilled = allUpdatedItems.every(
        (item) => item.received >= item.quantity,
      );
      const newStatus = allFulfilled
        ? PurchaseOrderStatus.RECEIVED
        : PurchaseOrderStatus.PARTIAL;

      return tx.purchaseOrder.update({
        where: { id: po.id },
        data: { status: newStatus },
        include: {
          supplier: true,
          items: {
            include: { product: true },
          },
        },
      });
    });
  }

  /**
   * Auto-draft POs for all products below their low stock threshold.
   * Groups items by preferred supplier and creates one PO per supplier.
   */
  async autoDraftPO(businessId: string, userId: string) {
    // 1. Find products at or below threshold
    const products = await this.prisma.product.findMany({
      where: { businessId, isActive: true },
      include: {
        stockRecord: true,
        preferredSupplier: true,
      },
    });

    const lowStockProducts = products.filter((p) => {
      const qty = Number(p.stockRecord?.quantity || 0);
      return qty <= (p.lowStockThreshold || 0);
    });

    if (lowStockProducts.length === 0) {
      return {
        message: 'All stock levels are healthy. No POs needed.',
        created: [],
      };
    }

    // 2. Calculate sales velocity for suggested order quantities
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesData = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        productId: { in: lowStockProducts.map((p) => p.id) },
        sale: {
          businessId,
          status: 'COMPLETED',
          createdAt: { gte: thirtyDaysAgo },
        },
      },
      _sum: { quantity: true },
    });

    const salesMap = new Map<string, number>();
    salesData.forEach((s) => {
      salesMap.set(s.productId, s._sum.quantity || 0);
    });

    const RESTOCK_DAYS = 14;

    // 3. Group by preferred supplier
    const supplierGroups = new Map<
      string,
      {
        supplierId: string;
        supplierName: string;
        items: Array<{ productId: string; quantity: number; cost: number }>;
      }
    >();

    for (const product of lowStockProducts) {
      const supplierId = product.preferredSupplierId;
      if (!supplierId || !product.preferredSupplier) continue; // Skip products without a preferred supplier

      const currentStock = Number(product.stockRecord?.quantity || 0);
      const unitsSold = salesMap.get(product.id) || 0;
      const dailyVelocity = unitsSold / 30;

      let suggestedOrder = Math.ceil(
        dailyVelocity * RESTOCK_DAYS - currentStock,
      );
      if (dailyVelocity === 0) {
        suggestedOrder = Math.max(
          0,
          Math.ceil((product.lowStockThreshold || 5) * 1.2) - currentStock,
        );
      }
      if (suggestedOrder < (product.lowStockThreshold || 0)) {
        suggestedOrder = product.lowStockThreshold || 10;
      }
      if (suggestedOrder <= 0) continue;

      if (!supplierGroups.has(supplierId)) {
        supplierGroups.set(supplierId, {
          supplierId,
          supplierName: product.preferredSupplier.name,
          items: [],
        });
      }

      supplierGroups.get(supplierId)!.items.push({
        productId: product.id,
        quantity: suggestedOrder,
        cost: Number(product.buyingPrice),
      });
    }

    // 4. Create POs for each supplier group
    const createdPOs: PurchaseOrder[] = [];

    for (const [, group] of supplierGroups) {
      if (group.items.length === 0) continue;

      const total = group.items.reduce(
        (sum, item) => sum + item.quantity * item.cost,
        0,
      );

      const timestamp = new Date().getTime().toString().slice(-6);
      const random = Math.random().toString(36).slice(2, 5).toUpperCase();
      const reference = `PO-AUTO-${timestamp}-${random}`;

      const po = await this.prisma.purchaseOrder.create({
        data: {
          reference,
          supplierId: group.supplierId,
          notes: `Auto-generated restock order for ${group.items.length} low-stock items`,
          total,
          items: {
            create: group.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              cost: item.cost,
            })),
          },
        },
        include: {
          supplier: true,
          items: {
            include: { product: true },
          },
        },
      });

      createdPOs.push(po);
    }

    // Count products skipped (no preferred supplier)
    const skippedCount = lowStockProducts.filter(
      (p) => !p.preferredSupplierId,
    ).length;

    return {
      message: `Created ${createdPOs.length} purchase order(s)${skippedCount > 0 ? `. ${skippedCount} product(s) skipped (no preferred supplier).` : '.'}`,
      created: createdPOs,
      skippedNoSupplier: skippedCount,
    };
  }
}
