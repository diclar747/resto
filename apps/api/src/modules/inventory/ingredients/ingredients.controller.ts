import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { IngredientsService } from './ingredients.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@Controller('inventory/ingredients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IngredientsController {
  constructor(private ingredientsService: IngredientsService) {}

  @Get()
  @RequirePermissions('inventory.view')
  findAll() {
    return this.ingredientsService.findAll();
  }

  @Get(':id')
  @RequirePermissions('inventory.view')
  findById(@Param('id') id: string) {
    return this.ingredientsService.findById(id);
  }

  @Post()
  @RequirePermissions('inventory.manage')
  create(@Body() body: { name: string; unit: string; costPerUnit?: number }) {
    return this.ingredientsService.create(body);
  }

  @Patch(':id')
  @RequirePermissions('inventory.manage')
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; unit?: string; costPerUnit?: number | null },
  ) {
    return this.ingredientsService.update(id, body);
  }

  @Delete(':id')
  @RequirePermissions('inventory.manage')
  delete(@Param('id') id: string) {
    return this.ingredientsService.delete(id);
  }
}
