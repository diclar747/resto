import { Module } from '@nestjs/common';
import { IngredientsModule } from './ingredients/ingredients.module';
import { RecipesModule } from './recipes/recipes.module';
import { StockModule } from './stock/stock.module';

@Module({
  imports: [IngredientsModule, RecipesModule, StockModule],
  exports: [IngredientsModule, RecipesModule, StockModule],
})
export class InventoryModule {}
