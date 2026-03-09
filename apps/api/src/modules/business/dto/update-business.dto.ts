import { IsEmail, IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateBusinessDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsEmail({}, { message: 'Invalid business email' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsNumber()
  @IsOptional()
  taxRate?: number;

  @IsString()
  @IsOptional()
  taxIdNumber?: string;
}
