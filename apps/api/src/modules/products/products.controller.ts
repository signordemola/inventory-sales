import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductIdDto } from './dto/product-id.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from 'generated/prisma/enums';
import { Request } from 'express';
import { Product } from 'generated/prisma/client';

@Controller('products')
@UseGuards(RolesGuard)
@Roles(UserRole.OWNER)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER)
  async findAll(@Query() query: ProductQueryDto, @Req() req: Request) {
    return this.productsService.findAll(req.user?.businessId!, query);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER)
  async findOne(
    @Param() params: ProductIdDto,
    @Req() req: Request,
  ): Promise<Product> {
    return this.productsService.findOne(params.id, req.user?.businessId!);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async create(
    @Body() dto: CreateProductDto,
    @Req() req: Request,
  ): Promise<Product> {
    return this.productsService.create(dto, req.user?.businessId!);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async update(
    @Param() params: ProductIdDto,
    @Body() dto: UpdateProductDto,
    @Req() req: Request,
  ): Promise<Product> {
    return this.productsService.update(params.id, dto, req.user?.businessId!);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  async remove(
    @Param() params: ProductIdDto,
    @Req() req: Request,
  ): Promise<Product> {
    return this.productsService.delete(params.id, req.user?.businessId!);
  }
}
