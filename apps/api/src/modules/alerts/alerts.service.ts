import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import {
  Product,
  StockRecord,
  NotificationType,
} from 'generated/prisma/client';

// Internal shape for stock records with their product joined
type StockRecordWithProduct = StockRecord & { product: Product };
// For expiry alerts we only need product fields
type ProductRecord = { product: Product };

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Runs daily at 8:00 AM to check for items that have fallen
   * below their configured low stock threshold.
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleDailyStockCheck() {
    this.logger.log('Starting daily stock and expiry checks...');
    const businesses = await this.prisma.business.findMany({
      select: { id: true },
    });

    for (const business of businesses) {
      await this.checkLowStockForBusiness(business.id);
      await this.checkExpiringProducts(business.id);
    }
  }

  /**
   * Event-driven check designed to run immediately after a sale.
   * This is extremely resource-efficient and prevents missing alerts on free tiers.
   */
  async checkLowStockForBusiness(businessId: string) {
    this.logger.log(`Running post-sale stock check for business ${businessId}`);

    const lowStockProducts = await this.prisma.stockRecord.findMany({
      where: {
        product: {
          businessId,
          isActive: true,
        },
      },
      include: {
        product: true,
      },
    });

    const productsToAlert = lowStockProducts.filter(
      (record) => record.quantity <= (record.product.lowStockThreshold || 0),
    );

    if (productsToAlert.length > 0) {
      await this.generateStockNotifications(businessId, productsToAlert);
      await this.autoDraftPurchaseOrders(businessId, productsToAlert);
    }
  }

  private async checkExpiringProducts(businessId: string) {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringProducts = await this.prisma.product.findMany({
      where: {
        businessId,
        isActive: true,
        expiryDate: {
          lte: thirtyDaysFromNow,
          gte: new Date(),
        },
      },
    });

    if (expiringProducts.length > 0) {
      const recordsToAlert: ProductRecord[] = expiringProducts.map((p) => ({
        product: p,
      }));
      await this.generateExpiryNotifications(businessId, recordsToAlert);
    }
  }

  private async generateStockNotifications(
    businessId: string,
    records: StockRecordWithProduct[],
  ) {
    const admins = await this.prisma.user.findMany({
      where: {
        businessId,
        isActive: true,
        role: { in: ['OWNER', 'MANAGER'] },
      },
      select: { id: true },
    });

    if (admins.length === 0) return;

    const notifications: {
      userId: string;
      businessId: string;
      type: NotificationType;
      message: string;
      read: boolean;
    }[] = [];

    for (const admin of admins) {
      for (const record of records) {
        notifications.push({
          userId: admin.id,
          businessId,
          type: 'LOW_STOCK',
          message: `Low Stock Alert: ${record.product.name}. Current stock: ${record.quantity}. Minimum threshold: ${record.product.lowStockThreshold}. Please reorder soon.`,
          read: false,
        });
      }
    }

    // In production, queue email drops here via BullMQ.
    // For this MVP, we insert notifications directly into the DB.
    await this.prisma.notification.createMany({
      data: notifications,
      skipDuplicates: true,
    });

    this.logger.log(
      `Generated ${notifications.length} low stock alerts for business ${businessId}`,
    );
  }

  private async generateExpiryNotifications(
    businessId: string,
    records: ProductRecord[],
  ) {
    const admins = await this.prisma.user.findMany({
      where: { businessId, isActive: true, role: { in: ['OWNER', 'MANAGER'] } },
      select: { id: true },
    });
    if (admins.length === 0) return;

    const notifications: {
      userId: string;
      businessId: string;
      type: NotificationType;
      message: string;
      read: boolean;
    }[] = [];

    for (const admin of admins) {
      for (const record of records) {
        notifications.push({
          userId: admin.id,
          businessId,
          type: 'OUT_OF_STOCK',
          message: `Expiry Alert: ${record.product.name} is expiring soon on ${record.product.expiryDate?.toDateString()}.`,
          read: false,
        });
      }
    }

    await this.prisma.notification.createMany({
      data: notifications,
      skipDuplicates: true,
    });
  }

  private async autoDraftPurchaseOrders(
    businessId: string,
    records: StockRecordWithProduct[],
  ) {
    const supplierMap = new Map<string, StockRecordWithProduct[]>();

    for (const record of records) {
      if (record.product.preferredSupplierId) {
        if (!supplierMap.has(record.product.preferredSupplierId)) {
          supplierMap.set(record.product.preferredSupplierId, []);
        }
        supplierMap.get(record.product.preferredSupplierId)?.push(record);
      }
    }

    for (const [supplierId, items] of supplierMap.entries()) {
      const now = new Date();
      const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
      const reference = `PO-AUTO-${datePart}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      let total = 0;

      const orderItemsToCreate = items.map((i) => {
        const orderQty = (i.product.lowStockThreshold || 10) * 2;
        const lineTotal = Number(i.product.buyingPrice) * orderQty;
        total += lineTotal;
        return {
          productId: i.product.id,
          quantity: orderQty,
          cost: i.product.buyingPrice,
        };
      });

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      await this.prisma.purchaseOrder.create({
        data: {
          reference,
          supplierId,
          status: 'PENDING',
          total,
          expectedDelivery: nextWeek,
          notes: 'Auto-drafted by Low Stock Alert System',
          items: {
            create: orderItemsToCreate,
          },
        },
      });

      this.logger.log(
        `Auto-drafted Purchase Order ${reference} for supplier ${supplierId}`,
      );
    }
  }

  /**
   * Event-driven check designed to run immediately after a sale syncs from an offline client.
   */
  async checkStockDiscrepancyAfterSale(
    businessId: string,
    saleItems: { productId: string; quantity: number }[],
    saleReference: string,
  ) {
    if (!saleItems.length) return;

    this.logger.log(
      `Running post-sale discrepancy check for sale ${saleReference} in business ${businessId}`,
    );

    const stockRecords = await this.prisma.stockRecord.findMany({
      where: {
        product: {
          businessId,
          isActive: true,
        },
        productId: { in: saleItems.map((i) => i.productId) },
      },
      include: {
        product: true,
      },
    });

    const negativeStockProducts = stockRecords.filter((r) => r.quantity < 0);

    if (negativeStockProducts.length > 0) {
      await this.generateDiscrepancyNotifications(
        businessId,
        negativeStockProducts,
        saleReference,
      );
    }
  }

  private async generateDiscrepancyNotifications(
    businessId: string,
    records: StockRecordWithProduct[],
    saleReference: string,
  ) {
    const admins = await this.prisma.user.findMany({
      where: {
        businessId,
        isActive: true,
        role: { in: ['OWNER', 'MANAGER'] },
      },
      select: { id: true },
    });

    if (admins.length === 0) return;

    const notifications: {
      userId: string;
      businessId: string;
      type: NotificationType;
      message: string;
      read: boolean;
    }[] = [];

    for (const admin of admins) {
      for (const record of records) {
        notifications.push({
          userId: admin.id,
          businessId,
          type: 'STOCK_DISCREPANCY',
          message: `Stock Discrepancy on Sale ${saleReference}: ${record.product.name} is now negative (${record.quantity}). This usually happens when offline sales sync for the same item.`,
          read: false,
        });
      }
    }

    await this.prisma.notification.createMany({
      data: notifications,
      skipDuplicates: true,
    });

    this.logger.warn(
      `Generated ${notifications.length} STOCK_DISCREPANCY alerts for business ${businessId} after sale ${saleReference}`,
    );
  }
}
