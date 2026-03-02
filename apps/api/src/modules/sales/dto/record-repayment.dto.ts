import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class RecordRepaymentDto {
  @IsNumber()
  @IsPositive({ message: 'Repayment amount must be greater than zero' })
  amount: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
