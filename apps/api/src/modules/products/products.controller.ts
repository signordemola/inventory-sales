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
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { multerOptions } from 'src/common/config/multer.config';
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

  @Post(':id/images')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ): Promise<Product> {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.productsService.uploadImage(id, req.user?.businessId!, file);
  }

  @Delete(':id/images/:publicId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async deleteImage(
    @Param('id') id: string,
    @Param('publicId') publicId: string,
    @Req() req: Request,
  ): Promise<Product> {
    // Reconstruct the actual Cloudinary public_id which may include slashes depending on the route param encoding
    // Let's decode it safely here
    const decodedPublicId = decodeURIComponent(publicId);
    return this.productsService.deleteImage(
      id,
      req.user?.businessId!,
      decodedPublicId,
    );
  }
}
