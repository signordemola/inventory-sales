import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { TaxReportService } from './tax-report.service';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from 'generated/prisma/enums';
import { Request, Response } from 'express';

@Controller('analytics/tax')
@UseGuards(RolesGuard)
@Roles(UserRole.OWNER)
export class TaxReportController {
  constructor(private readonly taxReportService: TaxReportService) {}

  @Get('vat-summary')
  getVATSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: Request,
  ) {
    return this.taxReportService.getVATSummary(
      req.user?.businessId!,
      startDate,
      endDate,
    );
  }

  @Get('invoices')
  getTaxInvoices(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: Request,
  ) {
    return this.taxReportService.getTaxInvoices(
      req.user?.businessId!,
      startDate,
      endDate,
    );
  }

  @Get('export')
  async exportVATReturn(
    @Query('period') period: 'monthly' | 'quarterly' = 'monthly',
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.taxReportService.exportVATReturn(
      req.user?.businessId!,
      period,
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    res.send(result.csv);
  }
}
