import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/common/config/multer.config';
import { BusinessService } from './business.service';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from 'generated/prisma/enums';
import { Request } from 'express';
import { Business } from 'generated/prisma/client';

@Controller('business')
@UseGuards(RolesGuard)
@Roles(UserRole.OWNER)
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get('me')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER)
  async findMe(@Req() req: Request): Promise<Business> {
    return this.businessService.findMe(req.user?.businessId!);
  }

  @Patch('me')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async updateMe(
    @Body() dto: UpdateBusinessDto,
    @Req() req: Request,
  ): Promise<Business> {
    return this.businessService.updateMe(req.user?.businessId!, dto);
  }

  @Patch('me/logo')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadLogo(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ): Promise<Business> {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.businessService.uploadLogo(req.user?.businessId!, file);
  }
}
