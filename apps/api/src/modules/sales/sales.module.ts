import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { SalesRepository } from './sales.repository';
import { PrismaModule } from 'src/modules/prisma/prisma.module';
import { AlertsModule } from 'src/modules/alerts/alerts.module';

@Module({
  imports: [PrismaModule, AlertsModule],
  controllers: [SalesController],
  providers: [SalesService, SalesRepository],
  exports: [SalesService],
})
export class SalesModule {}
