import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { UsersRepository } from './users.repository';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreateInviteDto } from './dto/create-invite.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { StaffInviteStatus, UserRole } from 'generated/prisma/enums';
import { auth } from 'src/config/auth';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly prisma: PrismaService,
  ) {}

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

  // Invite Logic

  async createInvite(dto: CreateInviteDto, businessId: string) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Valid for 7 days

    const invite = await this.prisma.staffInvite.create({
      data: {
        email: dto.email,
        role: dto.role,
        businessId,
        token,
        expiresAt,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return { inviteUrl: `${frontendUrl}/invite/${token}` };
  }

  async getInvite(token: string) {
    const invite = await this.prisma.staffInvite.findUnique({
      where: { token },
      include: { business: { select: { name: true } } },
    });

    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.status !== StaffInviteStatus.PENDING) {
      throw new ForbiddenException('Invite is no longer pending');
    }
    if (invite.expiresAt < new Date()) {
      await this.prisma.staffInvite.update({
        where: { token },
        data: { status: StaffInviteStatus.REVOKED },
      });
      throw new ForbiddenException('Invite has expired');
    }

    return invite;
  }

  async acceptInvite(token: string, dto: AcceptInviteDto) {
    const invite = await this.getInvite(token); // re-validates

    try {
      // Register via betterAuth API server-side
      const res = await auth.api.signUpEmail({
        body: {
          email: invite.email,
          password: dto.password,
          name: dto.name,
          role: invite.role,
          businessId: invite.businessId,
          isActive: true,
        },
      });

      if (!res) {
        throw new ForbiddenException(
          'Failed to register user account (unknown error)',
        );
      }
    } catch (error: any) {
      throw new ForbiddenException(
        error.message || 'Failed to register account via auth',
      );
    }

    // Mark invite as used
    await this.prisma.staffInvite.update({
      where: { token },
      data: { status: StaffInviteStatus.ACCEPTED },
    });

    return { success: true };
  }
}
