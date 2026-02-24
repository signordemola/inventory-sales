import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from 'generated/prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async findAll(businessId: string): Promise<Category[]> {
    return this.categoriesRepository.findMany({
      where: { businessId },
    });
  }

  async findOne(id: string, businessId: string): Promise<Category> {
    const category = await this.categoriesRepository.findUnique({ id });
    if (!category || category.businessId !== businessId) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async create(dto: CreateCategoryDto, businessId: string): Promise<Category> {
    return this.categoriesRepository.create({
      name: dto.name,
      description: dto.description,
      business: { connect: { id: businessId } },
      ...(dto.parentId && { parent: { connect: { id: dto.parentId } } }),
    });
  }

  async update(
    id: string,
    dto: UpdateCategoryDto,
    businessId: string,
  ): Promise<Category> {
    await this.findOne(id, businessId);
    return this.categoriesRepository.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        ...(dto.parentId && { parent: { connect: { id: dto.parentId } } }),
      },
    });
  }

  async delete(id: string, businessId: string): Promise<Category> {
    await this.findOne(id, businessId);
    return this.categoriesRepository.delete({ id });
  }
}
