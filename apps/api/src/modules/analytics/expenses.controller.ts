import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from 'generated/prisma/enums';

@Controller('analytics/expenses')
@UseGuards(RolesGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  create(@Req() req: any, @Body() createExpenseDto: any) {
    return this.expensesService.create(
      req.user.businessId,
      req.user.id,
      createExpenseDto,
    );
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  findAll(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.expensesService.findAll(
      req.user.businessId,
      startDate,
      endDate,
    );
  }

  @Get('summary')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  getSummary(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.expensesService.getSummaryByCategory(
      req.user.businessId,
      startDate,
      endDate,
    );
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.expensesService.findOne(id, req.user.businessId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateExpenseDto: any,
  ) {
    return this.expensesService.update(
      id,
      req.user.businessId,
      updateExpenseDto,
    );
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  remove(@Req() req: any, @Param('id') id: string) {
    return this.expensesService.remove(id, req.user.businessId);
  }
}
