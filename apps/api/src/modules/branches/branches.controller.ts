import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchesController {
  constructor(private branchesService: BranchesService) {}

  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.branchesService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.branchesService.findById(id);
  }

  @Post()
  @RequirePermissions('branches.manage')
  create(@Body() body: any) {
    if (body.admin) {
      const { admin, ...branchData } = body;
      return this.branchesService.createWithAdmin(branchData, admin);
    }
    return this.branchesService.create(body);
  }

  @Patch(':id')
  @RequirePermissions('branches.manage')
  update(@Param('id') id: string, @Body() body: any) {
    return this.branchesService.update(id, body);
  }

  @Delete(':id')
  @RequirePermissions('branches.manage')
  delete(@Param('id') id: string) {
    return this.branchesService.delete(id);
  }
}
