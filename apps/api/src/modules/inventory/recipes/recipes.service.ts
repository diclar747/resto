import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return {
      message: 'Recipes endpoint',
    };
  }
}
