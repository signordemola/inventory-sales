import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateSupplierPaymentDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
