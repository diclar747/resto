import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ModifiersService } from './modifiers.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@Controller('menu/modifiers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ModifiersController {
  constructor(private modifiersService: ModifiersService) {}

  @Get()
  @RequirePermissions('menu.view')
  findAllGroups() {
    return this.modifiersService.findAllGroups();
  }

  @Get(':id')
  @RequirePermissions('menu.view')
  findGroupById(@Param('id') id: string) {
    return this.modifiersService.findGroupById(id);
  }

  @Post()
  @RequirePermissions('menu.manage')
  createGroup(
    @Body()
    body: {
      name: string;
      minSelect?: number;
      maxSelect?: number;
      isRequired?: boolean;
      modifiers?: {
        name: string;
        priceAdjustment?: number;
        isActive?: boolean;
        sortOrder?: number;
      }[];
    },
  ) {
    return this.modifiersService.createGroup(body);
  }

  @Patch('items/:id')
  @RequirePermissions('menu.manage')
  updateModifier(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      priceAdjustment?: number;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    return this.modifiersService.updateModifier(id, body);
  }

  @Delete('items/:id')
  @RequirePermissions('menu.manage')
  @HttpCode(HttpStatus.OK)
  deleteModifier(@Param('id') id: string) {
    return this.modifiersService.deleteModifier(id);
  }

  @Post(':groupId/items')
  @RequirePermissions('menu.manage')
  addModifier(
    @Param('groupId') groupId: string,
    @Body()
    body: {
      name: string;
      priceAdjustment?: number;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    return this.modifiersService.addModifier(groupId, body);
  }

  @Patch(':id')
  @RequirePermissions('menu.manage')
  updateGroup(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      minSelect?: number;
      maxSelect?: number;
      isRequired?: boolean;
    },
  ) {
    return this.modifiersService.updateGroup(id, body);
  }

  @Delete(':id')
  @RequirePermissions('menu.manage')
  @HttpCode(HttpStatus.OK)
  deleteGroup(@Param('id') id: string) {
    return this.modifiersService.deleteGroup(id);
  }
}
