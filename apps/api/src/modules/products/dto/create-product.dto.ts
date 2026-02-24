import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsPositive,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  unit: string = 'piece';

  @IsNumber()
  @Min(0)
  @IsOptional()
  buyingPrice: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  sellingPrice: number = 0;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  lowStockThreshold: number = 10;

  @IsBoolean()
  @IsOptional()
  isActive: boolean = true;
}
