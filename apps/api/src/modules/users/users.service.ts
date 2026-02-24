import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UserRole } from 'generated/prisma/enums';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findAll(businessId: string) {
    return this.usersRepository.findMany({
      where: { businessId, isActive: true },
    });
  }

  async findOne(id: string, businessId: string) {
    const user = await this.usersRepository.findUnique({ id });
    if (!user || user.businessId !== businessId) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async create(dto: CreateUserDto, businessId: string) {
    return this.usersRepository.create({
      ...dto,
      business: { connect: { id: businessId } },
      isActive: true,
    });
  }

  async updateRole(
    id: string,
    dto: UpdateRoleDto,
    businessId: string,
    requestingUserId: string,
  ) {
    const user = await this.findOne(id, businessId);

    if (id === requestingUserId) {
      throw new ForbiddenException('You cannot change your own role');
    }

    return this.usersRepository.update({
      where: { id },
      data: { role: dto.role },
    });
  }

  async deactivate(id: string, businessId: string, requestingUserId: string) {
    const user = await this.findOne(id, businessId);

    if (id === requestingUserId) {
      throw new ForbiddenException('You cannot deactivate yourself');
    }

    if (user.role === UserRole.OWNER) {
      const owners = await this.usersRepository.findMany({
        where: { businessId, role: UserRole.OWNER, isActive: true },
      });
      if (owners.length <= 1) {
        throw new ForbiddenException(
          'Cannot deactivate the last owner of the business',
        );
      }
    }

    return this.usersRepository.delete({ id });
  }
}
