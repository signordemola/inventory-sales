import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { Prisma, Product, PrismaClient } from 'generated/prisma/client';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

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
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }] as any,
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

    // Block deletion if the product has any stock movements (was ever stocked)
    const stockMovementCount =
      await this.productsRepository.countStockMovements(id);
    if (stockMovementCount > 0) {
      throw new BadRequestException(
        'Cannot delete a product with stock movement history. Deactivate it instead.',
      );
    }

    // Block deletion if the product has any sale history
    const saleItemCount = await this.productsRepository.countSaleItems(id);
    if (saleItemCount > 0) {
      throw new BadRequestException(
        'Cannot delete a product that has been sold. Deactivate it instead.',
      );
    }

    return this.productsRepository.delete({ id });
  }

  async uploadImage(
    id: string,
    businessId: string,
    file: Express.Multer.File,
  ): Promise<Product> {
    const product = await this.findOne(id, businessId);
    if (product.images.length >= 5) {
      throw new BadRequestException('Maximum of 5 images allowed per product.');
    }

    const folder = `inventory/${businessId}/products/${id}`;
    const result = await this.cloudinaryService.uploadFile(file, folder);

    // Cloudinary returns the full URL in `secure_url`
    const newImageUrl = (result as any).secure_url;

    return this.productsRepository.update({
      where: { id },
      data: { images: { push: newImageUrl } },
    });
  }

  async deleteImage(
    id: string,
    businessId: string,
    publicId: string,
  ): Promise<Product> {
    const product = await this.findOne(id, businessId);

    // The client sends the Cloudinary publicId, but we store the full URL in the DB.
    // We filter out any URL that contains this publicId.
    const updatedImages = product.images.filter(
      (url) => !url.includes(publicId),
    );

    if (updatedImages.length === product.images.length) {
      throw new NotFoundException('Image not found on this product');
    }

    await this.cloudinaryService.deleteFile(publicId);

    return this.productsRepository.update({
      where: { id },
      data: { images: updatedImages },
    });
  }
}
