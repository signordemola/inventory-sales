import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { TaxReportService } from './tax-report.service';
import { TaxReportController } from './tax-report.controller';
import { AccountingReportService } from './accounting-report.service';
import { AccountingReportController } from './accounting-report.controller';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    AnalyticsController,
    TaxReportController,
    AccountingReportController,
    ExpensesController,
  ],
  providers: [
    AnalyticsService,
    TaxReportService,
    AccountingReportService,
    ExpensesService,
  ],
  exports: [
    AnalyticsService,
    TaxReportService,
    AccountingReportService,
    ExpensesService,
  ],
})
export class AnalyticsModule {}
