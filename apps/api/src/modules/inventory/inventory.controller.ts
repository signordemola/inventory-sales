import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { StockMovementQueryDto } from './dto/stock-movement-query.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from 'generated/prisma/enums';
import { Request } from 'express';

@Controller('inventory')
@UseGuards(RolesGuard)
@Roles(UserRole.OWNER)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('levels')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER)
  async getLevels(@Req() req: Request) {
    return this.inventoryService.getLevels(req.user?.businessId!);
  }

  @Get('history')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER)
  async getHistory(@Query() query: StockMovementQueryDto, @Req() req: Request) {
    return this.inventoryService.getHistory(req.user?.businessId!, query);
  }

  @Post('adjust')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async adjust(@Body() dto: AdjustStockDto, @Req() req: Request) {
    return this.inventoryService.adjustStock(dto, req.user?.id!);
  }
}
