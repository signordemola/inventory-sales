import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from 'generated/prisma/enums';
import { Request } from 'express';
import { PurchaseOrder } from 'generated/prisma/client';

@Controller('purchase-orders')
@UseGuards(RolesGuard)
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async create(@Body() dto: CreatePurchaseOrderDto, @Req() req: Request) {
    return this.purchaseOrdersService.create(dto, req.user?.businessId!);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async findAll(@Req() req: Request): Promise<PurchaseOrder[]> {
    return this.purchaseOrdersService.findAll(req.user?.businessId!);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async findOne(@Param('id') id: string, @Req() req: Request) {
    return this.purchaseOrdersService.findOne(id, req.user?.businessId!);
  }

  @Patch(':id/receive')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async receiveStock(
    @Param('id') id: string,
    @Body() dto: ReceivePurchaseOrderDto,
    @Req() req: Request,
  ) {
    return this.purchaseOrdersService.receiveStock(
      id,
      dto,
      req.user?.businessId!,
      req.user?.id!,
    );
  }

  @Post('auto-draft')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async autoDraftPO(@Req() req: Request) {
    return this.purchaseOrdersService.autoDraftPO(
      req.user?.businessId!,
      req.user?.id!,
    );
  }
}
