import { IsString, IsNotEmpty } from 'class-validator';

export class CustomerIdDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}
