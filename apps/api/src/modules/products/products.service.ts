import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { Product, Prisma } from 'generated/prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async findAll(businessId: string, query: ProductQueryDto) {
    const { search, categoryId, isActive, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      businessId,
      ...(isActive !== undefined && { isActive }),
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await this.productsRepository.findMany({
      skip,
      take: limit,
      where,
      orderBy: { createdAt: 'desc' },
    });

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, businessId: string): Promise<Product> {
    const product = await this.productsRepository.findUnique({ id });
    if (!product || product.businessId !== businessId) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async create(dto: CreateProductDto, businessId: string): Promise<Product> {
    const { categoryId, ...data } = dto;
    return this.productsRepository.create({
      ...data,
      business: { connect: { id: businessId } },
      ...(categoryId && { category: { connect: { id: categoryId } } }),
    });
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    businessId: string,
  ): Promise<Product> {
    await this.findOne(id, businessId);
    const { categoryId, ...data } = dto;

    return this.productsRepository.update({
      where: { id },
      data: {
        ...data,
        ...(categoryId !== undefined && {
          category: categoryId
            ? { connect: { id: categoryId } }
            : { disconnect: true },
        }),
      },
    });
  }

  async delete(id: string, businessId: string): Promise<Product> {
    await this.findOne(id, businessId);
    return this.productsRepository.delete({ id });
  }
}
