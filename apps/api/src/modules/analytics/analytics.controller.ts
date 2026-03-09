import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from 'generated/prisma/enums';
import { Request } from 'express';

@Controller('analytics')
@UseGuards(RolesGuard)
@Roles(UserRole.OWNER, UserRole.MANAGER)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('revenue')
  getRevenue(
    @Query('period') period: '7d' | '30d' | '90d' = '7d',
    @Req() req: Request,
  ) {
    return this.analyticsService.getRevenue(req.user?.businessId!, period);
  }

  @Get('products/top')
  getTopProducts(@Query('limit') limit: string, @Req() req: Request) {
    return this.analyticsService.getTopProducts(
      req.user?.businessId!,
      Number(limit) || 10,
    );
  }

  @Get('products/slow')
  getSlowProducts(@Query('limit') limit: string, @Req() req: Request) {
    return this.analyticsService.getSlowProducts(
      req.user?.businessId!,
      Number(limit) || 10,
    );
  }

  @Get('profit')
  getProfit(
    @Query('period') period: '7d' | '30d' | '90d' = '30d',
    @Req() req: Request,
  ) {
    return this.analyticsService.getProfit(req.user?.businessId!, period);
  }

  @Get('stock-valuation')
  getStockValuation(@Req() req: Request) {
    return this.analyticsService.getStockValuation(req.user?.businessId!);
  }

  @Get('cashiers')
  getCashierStats(@Req() req: Request) {
    return this.analyticsService.getCashierStats(req.user?.businessId!);
  }

  @Get('customers')
  getTopCustomers(@Query('limit') limit: string, @Req() req: Request) {
    return this.analyticsService.getTopCustomers(
      req.user?.businessId!,
      Number(limit) || 10,
    );
  }

  @Get('month-comparison')
  getMonthComparison(@Req() req: Request) {
    return this.analyticsService.getMonthComparison(req.user?.businessId!);
  }

  @Get('stockout-predictions')
  getStockoutPredictions(@Req() req: Request) {
    return this.analyticsService.getStockoutPredictions(req.user?.businessId!);
  }

  @Get('dead-stock')
  getDeadStock(@Query('days') days: string, @Req() req: Request) {
    return this.analyticsService.getDeadStock(
      req.user?.businessId!,
      Number(days) || 60,
    );
  }

  @Get('demand-forecast')
  getDemandForecast(@Query('days') days: string, @Req() req: Request) {
    return this.analyticsService.getDemandForecast(
      req.user?.businessId!,
      Number(days) || 7,
    );
  }

  @Get('peak-hours')
  getPeakHours(
    @Query('period') period: '7d' | '30d' | '90d' = '30d',
    @Req() req: Request,
  ) {
    return this.analyticsService.getPeakHours(req.user?.businessId!, period);
  }
}
