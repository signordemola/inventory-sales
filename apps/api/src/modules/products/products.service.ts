import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
    if (Number(dto.sellingPrice) < Number(dto.buyingPrice)) {
      throw new BadRequestException(
        'Selling price cannot be lower than buying price.',
      );
    }

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
    const product = await this.findOne(id, businessId);

    const buyingPrice =
      dto.buyingPrice !== undefined
        ? Number(dto.buyingPrice)
        : Number(product.buyingPrice);
    const sellingPrice =
      dto.sellingPrice !== undefined
        ? Number(dto.sellingPrice)
        : Number(product.sellingPrice);

    if (sellingPrice < buyingPrice) {
      throw new BadRequestException(
        'Selling price cannot be lower than buying price.',
      );
    }

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
