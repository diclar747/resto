import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return {
      message: 'Promotions endpoint',
    };
  }
}
