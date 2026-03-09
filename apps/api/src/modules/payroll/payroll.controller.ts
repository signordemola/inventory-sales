import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from 'generated/prisma/enums';
import { Request } from 'express';

@Controller('payroll')
@UseGuards(RolesGuard)
@Roles(UserRole.OWNER)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get('configs')
  getStaffConfigs(@Req() req: Request) {
    return this.payrollService.getStaffPayrollConfigs(req.user?.businessId!);
  }

  @Patch('configs/:userId')
  updatePayrollConfig(
    @Param('userId') userId: string,
    @Body()
    dto: {
      baseSalary: number;
      commissionRate: number;
      payFrequency?: string;
    },
    @Req() req: Request,
  ) {
    return this.payrollService.updatePayrollConfig(
      userId,
      req.user?.businessId!,
      dto,
    );
  }

  @Post('generate')
  generatePayroll(
    @Body() dto: { periodStart: string; periodEnd: string },
    @Req() req: Request,
  ) {
    return this.payrollService.generatePayrollPeriod(
      req.user?.businessId!,
      dto.periodStart,
      dto.periodEnd,
    );
  }

  @Get('records')
  getPayrollRecords(@Req() req: Request) {
    return this.payrollService.getPayrollRecords(req.user?.businessId!);
  }

  @Patch('records/:id/approve')
  approvePayroll(@Param('id') id: string, @Req() req: Request) {
    return this.payrollService.approvePayroll(id, req.user?.businessId!);
  }

  @Patch('records/:id/paid')
  markPaid(@Param('id') id: string, @Req() req: Request) {
    return this.payrollService.markPaid(id, req.user?.businessId!);
  }
}
