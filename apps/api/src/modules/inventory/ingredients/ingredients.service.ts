import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class IngredientsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return {
      message: 'Ingredients endpoint',
    };
  }
}
