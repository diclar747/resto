import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
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
  findAll() {
    return this.branchesService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.branchesService.findById(id);
  }

  @Post()
  @RequirePermissions('branches.manage')
  create(@Body() body: any) {
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
