import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCreditRepaymentDto {
  @IsString()
  @IsNotEmpty()
  creditSaleId: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
