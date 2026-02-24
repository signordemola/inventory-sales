import { IsNotEmpty, IsString } from 'class-validator';

export class SaleIdDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}
