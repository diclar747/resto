import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ModifiersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return {
      message: 'Modifiers endpoint',
    };
  }
}
