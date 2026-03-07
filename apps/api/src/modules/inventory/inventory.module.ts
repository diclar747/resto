import { Module } from '@nestjs/common';
import { IngredientsModule } from './ingredients/ingredients.module';
import { RecipesModule } from './recipes/recipes.module';
import { StockModule } from './stock/stock.module';
import { WasteModule } from './waste/waste.module';

@Module({
  imports: [IngredientsModule, RecipesModule, StockModule, WasteModule],
  exports: [IngredientsModule, RecipesModule, StockModule, WasteModule],
})
export class InventoryModule {}
