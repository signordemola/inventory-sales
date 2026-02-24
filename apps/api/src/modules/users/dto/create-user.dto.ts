import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { UserRole } from 'generated/prisma/enums';

export class CreateUserDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(UserRole, { message: 'Invalid user role' })
  @IsNotEmpty()
  role: UserRole;

  @IsString()
  @IsOptional()
  businessId?: string;
}
