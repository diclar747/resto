import { Module } from '@nestjs/common';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { ModifiersModule } from './modifiers/modifiers.module';

@Module({
  imports: [CategoriesModule, ProductsModule, ModifiersModule],
  exports: [CategoriesModule, ProductsModule, ModifiersModule],
})
export class MenuModule {}
