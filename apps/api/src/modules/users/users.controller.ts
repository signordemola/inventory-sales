import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UserIdDto } from './dto/user-id.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from 'generated/prisma/enums';
import { Request } from 'express';
import { User } from 'generated/prisma/client';
import { CreateInviteDto } from './dto/create-invite.dto';

@Controller('users')
@UseGuards(RolesGuard)
@Roles(UserRole.OWNER)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async findAll(@Req() req: Request): Promise<User[]> {
    const businessId = req.user?.businessId!;
    return this.usersService.findAll(businessId);
  }

  @Get('me')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER)
  getMe(@Req() req: Request) {
    return req.user;
  }

  // Invite Endpoints

  @Post('invite')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async createInvite(@Body() dto: CreateInviteDto, @Req() req: Request) {
    const businessId = req.user?.businessId!;
    return this.usersService.createInvite(dto, businessId);
  }

  @Get('invites')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async getPendingInvites(@Req() req: Request) {
    const businessId = req.user?.businessId!;
    return this.usersService.getPendingInvites(businessId);
  }

  @Delete('invites/:token')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async revokeInvite(@Param('token') token: string, @Req() req: Request) {
    const businessId = req.user?.businessId!;
    return this.usersService.revokeInvite(token, businessId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async findOne(
    @Param() params: UserIdDto,
    @Req() req: Request,
  ): Promise<User> {
    const businessId = req.user?.businessId!;
    return this.usersService.findOne(params.id, businessId);
  }

  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
    @Req() req: Request,
  ): Promise<User> {
    const businessId = req.user?.businessId!;
    return this.usersService.create(createUserDto, businessId);
  }

  @Patch(':id/role')
  async updateRole(
    @Param() params: UserIdDto,
    @Body() updateRoleDto: UpdateRoleDto,
    @Req() req: Request,
  ): Promise<User> {
    const businessId = req.user?.businessId!;
    const requestingUserId = req.user?.id!;
    return this.usersService.updateRole(
      params.id,
      updateRoleDto,
      businessId,
      requestingUserId,
    );
  }

  @Delete(':id')
  async remove(@Param() params: UserIdDto, @Req() req: Request): Promise<User> {
    const businessId = req.user?.businessId!;
    const requestingUserId = req.user?.id!;
    return this.usersService.deactivate(
      params.id,
      businessId,
      requestingUserId,
    );
  }
}
