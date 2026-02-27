import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from 'generated/prisma/enums';

export class CreateInviteDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}
