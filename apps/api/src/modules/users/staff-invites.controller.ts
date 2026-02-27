import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@Controller('public-invites')
@AllowAnonymous()
export class StaffInvitesController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':token')
  async getInvite(@Param('token') token: string) {
    return this.usersService.getInvite(token);
  }

  @Post(':token/accept')
  async acceptInvite(
    @Param('token') token: string,
    @Body() dto: AcceptInviteDto,
  ) {
    return this.usersService.acceptInvite(token, dto);
  }
}
