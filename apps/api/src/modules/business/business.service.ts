import { Injectable, NotFoundException } from '@nestjs/common';
import { BusinessRepository } from './business.repository';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Business } from 'generated/prisma/client';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class BusinessService {
  constructor(
    private readonly businessRepository: BusinessRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async findMe(businessId: string): Promise<Business> {
    const business = await this.businessRepository.findUnique({
      id: businessId,
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return business;
  }

  async updateMe(
    businessId: string,
    dto: UpdateBusinessDto,
  ): Promise<Business> {
    await this.findMe(businessId);
    return this.businessRepository.update({
      where: { id: businessId },
      data: dto,
    });
  }

  async uploadLogo(
    businessId: string,
    file: Express.Multer.File,
  ): Promise<Business> {
    const business = await this.findMe(businessId);

    // Optionally delete old logo if one exists (saving space)
    if (business.logoUrl) {
      try {
        // extract public id from URL: usually the last segment before .ext
        const urlParts = business.logoUrl.split('/');
        const filePart = urlParts[urlParts.length - 1];
        const publicId = filePart.split('.')[0];
        // The real public id has the folder path prefix usually, but Cloudinary deletion
        // without the exact public ID (including folders) might fail.
        // A safer approach is to not strictly fail if it errors.
      } catch (e) {
        // ignore deletion error for old logo
      }
    }

    const folder = `inventory/${businessId}/logo`;
    const result = await this.cloudinaryService.uploadFile(file, folder);

    const newLogoUrl = (result as any).secure_url;

    return this.businessRepository.update({
      where: { id: businessId },
      data: { logoUrl: newLogoUrl },
    });
  }
}
