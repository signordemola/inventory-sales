import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsPositive,
} from 'class-validator';

export class CreateSaleItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsOptional()
  variantId?: string;

  @IsInt()
  @IsPositive({ message: 'Quantity must be at least 1' })
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @Min(0, { message: 'Unit price cannot be negative' })
  @IsNotEmpty()
  unitPrice: number;
}
