import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail({}, { message: 'Invalid supplier email' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;
}
