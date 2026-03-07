import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return {
      message: 'Stock endpoint',
    };
  }
}
