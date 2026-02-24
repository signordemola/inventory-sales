import { IsNotEmpty, IsString } from 'class-validator';

export class SupplierIdDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}
