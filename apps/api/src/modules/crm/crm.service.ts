import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CrmService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return {
      message: 'CRM endpoint',
    };
  }
}
