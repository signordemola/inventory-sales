import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Version,
} from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { UserRole } from 'generated/prisma/enums';

@Controller('shifts')
@UseGuards(RolesGuard)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Version('1')
  @Post('open')
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.OWNER)
  async openShift(@Request() req: any, @Body() body: { startingCash: number }) {
    return this.shiftsService.openShift(
      req.user.businessId,
      req.user.id,
      body.startingCash,
    );
  }

  @Version('1')
  @Post('close')
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.OWNER)
  async closeShift(
    @Request() req: any,
    @Body() body: { actualCash: number; notes?: string },
  ) {
    return this.shiftsService.closeShift(
      req.user.businessId,
      req.user.id,
      body.actualCash,
      body.notes,
    );
  }

  @Version('1')
  @Get('current')
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.OWNER)
  async getCurrentShift(@Request() req: any) {
    return this.shiftsService.getCurrentShift(req.user.businessId, req.user.id);
  }

  @Version('1')
  @Get('my')
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.OWNER)
  async getMyShifts(@Request() req: any) {
    return this.shiftsService.getMyShifts(req.user.businessId, req.user.id);
  }

  @Version('1')
  @Get()
  @Roles(UserRole.MANAGER, UserRole.OWNER)
  async getAllShifts(@Request() req: any) {
    return this.shiftsService.getAllShifts(req.user.businessId);
  }
}
