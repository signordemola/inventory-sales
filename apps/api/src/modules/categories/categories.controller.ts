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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryIdDto } from './dto/category-id.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from 'generated/prisma/enums';
import { Request } from 'express';
import { Category } from 'generated/prisma/client';

@Controller('categories')
@UseGuards(RolesGuard)
@Roles(UserRole.OWNER)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER)
  async findAll(@Req() req: Request): Promise<Category[]> {
    return this.categoriesService.findAll(req.user?.businessId!);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER)
  async findOne(
    @Param() params: CategoryIdDto,
    @Req() req: Request,
  ): Promise<Category> {
    return this.categoriesService.findOne(params.id, req.user?.businessId!);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async create(
    @Body() dto: CreateCategoryDto,
    @Req() req: Request,
  ): Promise<Category> {
    return this.categoriesService.create(dto, req.user?.businessId!);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async update(
    @Param() params: CategoryIdDto,
    @Body() dto: UpdateCategoryDto,
    @Req() req: Request,
  ): Promise<Category> {
    return this.categoriesService.update(params.id, dto, req.user?.businessId!);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  async remove(
    @Param() params: CategoryIdDto,
    @Req() req: Request,
  ): Promise<Category> {
    return this.categoriesService.delete(params.id, req.user?.businessId!);
  }
}
