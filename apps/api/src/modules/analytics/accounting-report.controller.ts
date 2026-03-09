import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AccountingReportService } from './accounting-report.service';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from 'generated/prisma/enums';
import { Request, Response } from 'express';

@Controller('analytics/accounting')
@UseGuards(RolesGuard)
@Roles(UserRole.OWNER)
export class AccountingReportController {
  constructor(
    private readonly accountingReportService: AccountingReportService,
  ) {}

  @Get('pnl')
  getProfitAndLoss(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: Request,
  ) {
    return this.accountingReportService.getProfitAndLoss(
      req.user?.businessId!,
      startDate,
      endDate,
    );
  }

  @Get('cashflow')
  getCashFlowSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: Request,
  ) {
    return this.accountingReportService.getCashFlowSummary(
      req.user?.businessId!,
      startDate,
      endDate,
    );
  }

  @Get('export')
  async exportCSV(
    @Query('type') type: 'pnl' | 'cashflow' = 'pnl',
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.accountingReportService.exportAccountingCSV(
      req.user?.businessId!,
      type,
      startDate,
      endDate,
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    res.send(result.csv);
  }
}
