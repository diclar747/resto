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
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@Controller('menu/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  @RequirePermissions('menu.view')
  findAll(@Query('branchId') branchId: string) {
    return this.categoriesService.findAll(branchId);
  }

  @Get('reorder')
  // placeholder route to prevent `:id` from catching "reorder" as a param
  // the actual reorder is a PATCH below
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('menu.view')
  reorderPlaceholder() {
    return [];
  }

  @Get(':id')
  @RequirePermissions('menu.view')
  findById(@Param('id') id: string) {
    return this.categoriesService.findById(id);
  }

  @Post()
  @RequirePermissions('menu.manage')
  create(
    @Body()
    body: {
      name: string;
      branchId: string;
      description?: string;
      imageUrl?: string;
      sortOrder?: number;
      parentId?: string;
    },
  ) {
    return this.categoriesService.create(body);
  }

  @Patch('reorder')
  @RequirePermissions('menu.manage')
  reorder(@Body() body: { items: { id: string; sortOrder: number }[] }) {
    return this.categoriesService.reorder(body.items);
  }

  @Patch(':id')
  @RequirePermissions('menu.manage')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      imageUrl?: string;
      sortOrder?: number;
      parentId?: string;
      isActive?: boolean;
    },
  ) {
    return this.categoriesService.update(id, body);
  }

  @Delete(':id')
  @RequirePermissions('menu.manage')
  @HttpCode(HttpStatus.OK)
  delete(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }
}
