import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SupplierIdDto } from './dto/supplier-id.dto';
import { CreateSupplierPaymentDto } from './dto/create-supplier-payment.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from 'generated/prisma/enums';
import { Request } from 'express';
import { Supplier } from 'generated/prisma/client';

@Controller('suppliers')
@UseGuards(RolesGuard)
@Roles(UserRole.OWNER)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async findAll(@Req() req: Request): Promise<Supplier[]> {
    return this.suppliersService.findAll(req.user?.businessId!);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async findOne(
    @Param() params: SupplierIdDto,
    @Req() req: Request,
  ): Promise<Supplier> {
    return this.suppliersService.findOne(params.id, req.user?.businessId!);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async create(
    @Body() dto: CreateSupplierDto,
    @Req() req: Request,
  ): Promise<Supplier> {
    return this.suppliersService.create(dto, req.user?.businessId!);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async update(
    @Param() params: SupplierIdDto,
    @Body() dto: UpdateSupplierDto,
    @Req() req: Request,
  ): Promise<Supplier> {
    return this.suppliersService.update(params.id, dto, req.user?.businessId!);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  async remove(
    @Param() params: SupplierIdDto,
    @Req() req: Request,
  ): Promise<Supplier> {
    return this.suppliersService.delete(params.id, req.user?.businessId!);
  }

  @Get(':id/balance')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async getBalance(@Param() params: SupplierIdDto, @Req() req: Request) {
    return this.suppliersService.getBalance(params.id, req.user?.businessId!);
  }

  @Post(':id/payments')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async createPayment(
    @Param() params: SupplierIdDto,
    @Body() dto: CreateSupplierPaymentDto,
    @Req() req: Request,
  ) {
    return this.suppliersService.createPayment(
      params.id,
      dto,
      req.user?.businessId!,
    );
  }
}
