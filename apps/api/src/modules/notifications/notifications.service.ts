import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForUser(userId: string, businessId: string) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        businessId,
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to 50 most recent to keep payload manageable
    });
  }

  async markAsRead(id: string, userId: string, businessId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (
      !notification ||
      notification.userId !== userId ||
      notification.businessId !== businessId
    ) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string, businessId: string) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        businessId,
        read: false,
      },
      data: { read: true },
    });

    return { success: true };
  }
}
