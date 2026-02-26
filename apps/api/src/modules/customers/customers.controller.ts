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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CreateCreditRepaymentDto } from './dto/create-credit-repayment.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerIdDto } from './dto/customer-id.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from 'generated/prisma/enums';
import { Request } from 'express';
import { Customer } from 'generated/prisma/client';

@Controller('customers')
@UseGuards(RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER)
  async findAll(@Req() req: Request): Promise<Customer[]> {
    return this.customersService.findAll(req.user?.businessId!);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER)
  async findOne(
    @Param() params: CustomerIdDto,
    @Req() req: Request,
  ): Promise<Customer> {
    return this.customersService.findOne(params.id, req.user?.businessId!);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async create(
    @Body() dto: CreateCustomerDto,
    @Req() req: Request,
  ): Promise<Customer> {
    return this.customersService.create(dto, req.user?.businessId!);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async update(
    @Param() params: CustomerIdDto,
    @Body() dto: UpdateCustomerDto,
    @Req() req: Request,
  ): Promise<Customer> {
    return this.customersService.update(params.id, dto, req.user?.businessId!);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  async remove(
    @Param() params: CustomerIdDto,
    @Req() req: Request,
  ): Promise<Customer> {
    return this.customersService.delete(params.id, req.user?.businessId!);
  }

  // Credit Ledger Endpoints

  @Post('repayments')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async createRepayment(
    @Body() dto: CreateCreditRepaymentDto,
    @Req() req: Request,
  ) {
    return this.customersService.createRepayment(dto, req.user?.businessId!);
  }
}
