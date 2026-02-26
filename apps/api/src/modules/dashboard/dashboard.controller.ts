import { Controller, Get, UseGuards, Request, Version } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { UserRole } from 'generated/prisma/enums';

@Controller('analytics')
@UseGuards(RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {
    console.log('✅ DashboardController initialized');
  }

  @Version('1')
  @Get('dashboard')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER)
  async getDashboardStats(@Request() req: any) {
    const { businessId, id, role } = req.user;
    return this.dashboardService.getStats(businessId, { id, role });
  }
}
