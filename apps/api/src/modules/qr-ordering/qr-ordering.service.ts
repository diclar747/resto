import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class QrOrderingService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return {
      message: 'QR Ordering endpoint',
    };
  }
}
