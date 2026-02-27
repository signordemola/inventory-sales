import { Module } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { SuppliersRepository } from './suppliers.repository';
import { PrismaModule } from 'src/modules/prisma/prisma.module';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders.service';

@Module({
  imports: [PrismaModule],
  controllers: [SuppliersController, PurchaseOrdersController],
  providers: [SuppliersService, SuppliersRepository, PurchaseOrdersService],
  exports: [SuppliersService],
})
export class SuppliersModule {}
