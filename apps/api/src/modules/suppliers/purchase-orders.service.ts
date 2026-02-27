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
}
