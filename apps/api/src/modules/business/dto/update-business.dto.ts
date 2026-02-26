import { IsEmail, IsOptional, IsString, IsPhoneNumber } from 'class-validator';

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

  @IsOptional()
  taxRate?: number;
}
