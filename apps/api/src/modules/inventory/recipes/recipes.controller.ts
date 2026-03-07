import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RecipesService, RecipeItemInput } from './recipes.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@Controller('inventory/recipes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecipesController {
  constructor(private recipesService: RecipesService) {}

  @Get(':productId')
  @RequirePermissions('inventory.view')
  findByProduct(@Param('productId') productId: string) {
    return this.recipesService.findByProduct(productId);
  }

  @Post(':productId')
  @RequirePermissions('inventory.manage')
  setRecipe(
    @Param('productId') productId: string,
    @Body() body: { items: RecipeItemInput[] },
  ) {
    return this.recipesService.setRecipe(productId, body.items ?? []);
  }

  @Delete(':productId')
  @RequirePermissions('inventory.manage')
  deleteRecipe(@Param('productId') productId: string) {
    return this.recipesService.deleteRecipe(productId);
  }

  @Get(':productId/cost')
  @RequirePermissions('inventory.view')
  calculateCost(@Param('productId') productId: string) {
    return this.recipesService.calculateCost(productId);
  }
}
