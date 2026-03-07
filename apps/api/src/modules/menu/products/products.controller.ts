import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@Controller('menu/products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  // Public endpoint — no auth guard
  @Get('public-menu/:branchId')
  getPublicMenu(@Param('branchId') branchId: string) {
    return this.productsService.findMenu(branchId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @RequirePermissions('menu.view')
  findAll(
    @Query('branchId') branchId: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.productsService.findAll(branchId, categoryId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  @RequirePermissions('menu.view')
  findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @RequirePermissions('menu.manage')
  create(
    @Body()
    body: {
      name: string;
      categoryId: string;
      description?: string;
      imageUrl?: string;
      sku?: string;
      sortOrder?: number;
      prepTime?: number;
      kitchenStationId?: string;
      variants?: {
        name: string;
        price: number;
        cost?: number;
        isDefault?: boolean;
        isActive?: boolean;
        sortOrder?: number;
      }[];
      modifierGroupIds?: string[];
    },
  ) {
    return this.productsService.create(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/availability')
  @RequirePermissions('menu.manage')
  updateAvailability(
    @Param('id') id: string,
    @Body() body: { branchId: string; isAvailable: boolean },
  ) {
    return this.productsService.updateAvailability(id, body.branchId, body.isAvailable);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  @RequirePermissions('menu.manage')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      categoryId?: string;
      description?: string;
      imageUrl?: string;
      sku?: string;
      sortOrder?: number;
      prepTime?: number;
      kitchenStationId?: string;
      isActive?: boolean;
      modifierGroupIds?: string[];
    },
  ) {
    return this.productsService.update(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  @RequirePermissions('menu.manage')
  @HttpCode(HttpStatus.OK)
  delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }
}
