import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { SaleStatus, PaymentMethod } from 'generated/prisma/enums';

export class SaleQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(SaleStatus)
  @IsOptional()
  status?: SaleStatus;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  cashierId?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page: number = 1;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit: number = 20;
}
