import { Controller, Get } from '@nestjs/common';
import { RecipesService } from './recipes.service';

@Controller('recipes')
export class RecipesController {
  constructor(private recipesService: RecipesService) {}

  @Get()
  async findAll() {
    return this.recipesService.findAll();
  }
}
