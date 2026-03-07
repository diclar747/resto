import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class KdsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return {
      message: 'KDS endpoint',
    };
  }
}
