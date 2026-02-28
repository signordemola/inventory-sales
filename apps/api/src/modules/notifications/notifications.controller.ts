import { Controller, Get, Patch, Param, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from 'generated/prisma/enums';
import { Request } from 'express';

@Controller('notifications')
@UseGuards(RolesGuard)
// We allow all roles because Cashiers might eventually get shift-specific notifications
@Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@Req() req: Request) {
    const userId = req.user?.id!;
    const businessId = req.user?.businessId!;
    return this.notificationsService.findAllForUser(userId, businessId);
  }

  @Patch('read-all')
  async markAllAsRead(@Req() req: Request) {
    const userId = req.user?.id!;
    const businessId = req.user?.businessId!;
    return this.notificationsService.markAllAsRead(userId, businessId);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.id!;
    const businessId = req.user?.businessId!;
    return this.notificationsService.markAsRead(id, userId, businessId);
  }
}
