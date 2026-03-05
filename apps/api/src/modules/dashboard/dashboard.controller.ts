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

  @Version('1')
  @Get('cashier-shift')
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.OWNER)
  async getCashierShiftStats(@Request() req: any) {
    const { businessId, id } = req.user;
    return this.dashboardService.getCashierShift(businessId, id);
  }

  @Version('1')
  @Get('profit-insights')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async getProfitInsights(@Request() req: any) {
    const { businessId } = req.user;
    return this.dashboardService.getProfitInsights(businessId);
  }

  @Version('1')
  @Get('restock-suggestions')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async getRestockSuggestions(@Request() req: any) {
    const { businessId } = req.user;
    return this.dashboardService.getRestockSuggestions(businessId);
  }
}
