import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return {
      message: 'Delivery endpoint',
    };
  }
}
