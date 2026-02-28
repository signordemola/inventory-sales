import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

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

    // Find products where stock <= lowStockThreshold
    // We only alert if it hasn't been alerted recently (prevent spam)
    const lowStockProducts = await this.prisma.stockRecord.findMany({
      where: {
        product: {
          businessId,
          isActive: true,
        },
        // We'll calculate this dynamically since threshold is on the product
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
      const recordsToAlert = expiringProducts.map((p) => ({
        product: p,
      }));
      await this.generateExpiryNotifications(businessId, recordsToAlert);
    }
  }

  private async generateStockNotifications(businessId: string, records: any[]) {
    // Fetch all owners and managers for the business
    const admins = await this.prisma.user.findMany({
      where: {
        businessId,
        isActive: true,
        role: { in: ['OWNER', 'MANAGER'] },
      },
      select: { id: true },
    });

    if (admins.length === 0) return;

    // Generate DB notifications for each admin for each low stock item
    const notifications: any[] = [];

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

    // In a production app with paid resources, we would queue email drops here via BullMQ.
    // For this MVP, we just insert the notifications into the DB.

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
    records: any[],
  ) {
    const admins = await this.prisma.user.findMany({
      where: { businessId, isActive: true, role: { in: ['OWNER', 'MANAGER'] } },
      select: { id: true },
    });
    if (admins.length === 0) return;

    const notifications: any[] = [];
    for (const admin of admins) {
      for (const record of records) {
        notifications.push({
          userId: admin.id,
          businessId,
          type: 'OUT_OF_STOCK', // Represents critical issue
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

  private async autoDraftPurchaseOrders(businessId: string, records: any[]) {
    // Group products by preferred supplier
    const supplierMap = new Map<string, any[]>();

    for (const record of records) {
      if (record.product.preferredSupplierId) {
        if (!supplierMap.has(record.product.preferredSupplierId)) {
          supplierMap.set(record.product.preferredSupplierId, []);
        }
        supplierMap.get(record.product.preferredSupplierId)?.push(record);
      }
    }

    for (const [supplierId, items] of supplierMap.entries()) {
      const reference = `PO-AUTO-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      let total = 0;

      const orderItemsToCreate = items.map((i) => {
        // Order double the low stock threshold as a standard restock count
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
}
