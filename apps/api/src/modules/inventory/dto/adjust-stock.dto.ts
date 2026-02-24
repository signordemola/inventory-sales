import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  IsNumber,
} from 'class-validator';
import { StockMovementType } from 'generated/prisma/enums';

export class AdjustStockDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsOptional()
  variantId?: string;

  @IsEnum(StockMovementType, { message: 'Invalid movement type' })
  @IsNotEmpty()
  type: StockMovementType;

  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1' })
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @IsString()
  @IsOptional()
  supplierId?: string;
}
