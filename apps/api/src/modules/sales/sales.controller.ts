import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleQueryDto } from './dto/sale-query.dto';
import { SaleIdDto } from './dto/sale-id.dto';
import { ReturnSaleDto } from './dto/return-sale.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from 'generated/prisma/enums';
import { Request } from 'express';

@Controller('sales')
@UseGuards(RolesGuard)
@Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  async findAll(@Query() query: SaleQueryDto, @Req() req: Request) {
    return this.salesService.findAll(req.user?.businessId!, query);
  }

  @Get('daily-summary')
  async getDailySummary(@Query('date') date: string, @Req() req: Request) {
    return this.salesService.getDailySummary(req.user?.businessId!, date);
  }

  @Get(':id')
  async findOne(@Param() params: SaleIdDto, @Req() req: Request) {
    return this.salesService.findOne(params.id, req.user?.businessId!);
  }

  @Post()
  async create(@Body() dto: CreateSaleDto, @Req() req: Request) {
    const businessId = req.user?.businessId!;
    const cashierId = req.user?.id!;
    return this.salesService.create(dto, businessId, cashierId);
  }

  @Post(':id/return')
  async returnSale(
    @Param('id') id: string,
    @Body() dto: ReturnSaleDto,
    @Req() req: Request,
  ) {
    const businessId = req.user?.businessId!;
    const userId = req.user?.id!;
    return this.salesService.returnSale(id, businessId, dto, userId);
  }
}
