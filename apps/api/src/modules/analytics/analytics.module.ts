import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { TaxReportService } from './tax-report.service';
import { TaxReportController } from './tax-report.controller';
import { AccountingReportService } from './accounting-report.service';
import { AccountingReportController } from './accounting-report.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    AnalyticsController,
    TaxReportController,
    AccountingReportController,
  ],
  providers: [AnalyticsService, TaxReportService, AccountingReportService],
  exports: [AnalyticsService, TaxReportService, AccountingReportService],
})
export class AnalyticsModule {}
