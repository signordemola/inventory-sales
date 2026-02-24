import { Injectable, NotFoundException } from '@nestjs/common';
import { BusinessRepository } from './business.repository';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Business } from 'generated/prisma/client';

@Injectable()
export class BusinessService {
  constructor(private readonly businessRepository: BusinessRepository) {}

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
}
