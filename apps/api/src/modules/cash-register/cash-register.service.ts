import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CashRegisterService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return {
      message: 'Cash Register endpoint',
    };
  }
}
