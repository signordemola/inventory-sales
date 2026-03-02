import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  IsPositive,
} from 'class-validator';
import { SaleStatus } from 'generated/prisma/enums';
import { CreateSaleItemDto } from './create-sale-item.dto';
import { CreatePaymentDto } from './create-payment.dto';

export class CreateSaleDto {
  @IsString()
  @IsOptional()
  uid?: string; // client-generated UUID for offline idempotency

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  @IsNotEmpty()
  items: CreateSaleItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentDto)
  @IsNotEmpty()
  payments: CreatePaymentDto[];

  @IsNumber()
  @Min(0, { message: 'Discount cannot be negative' })
  @IsOptional()
  discount: number = 0;

  @IsString()
  @IsOptional()
  discountType?: string;

  @IsEnum(SaleStatus, { message: 'Invalid sale status' })
  @IsOptional()
  status: SaleStatus = SaleStatus.COMPLETED;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  @IsOptional()
  creditDueDate?: string; // ISO date — only used when payment method is CREDIT
}
