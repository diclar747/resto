import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @RequirePermissions('users.view')
  findAll(@Query('branchId') branchId?: string) {
    return this.usersService.findAll(branchId);
  }

  @Get(':id')
  @RequirePermissions('users.view')
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @RequirePermissions('users.manage')
  create(@Body() body: any) {
    return this.usersService.create(body);
  }

  @Patch(':id')
  @RequirePermissions('users.manage')
  update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.update(id, body);
  }

  @Patch(':id/pin')
  @RequirePermissions('users.manage')
  updatePin(@Param('id') id: string, @Body('pin') pin: string) {
    return this.usersService.updatePin(id, pin);
  }

  @Patch(':id/password')
  @RequirePermissions('users.manage')
  updatePassword(@Param('id') id: string, @Body('password') password: string) {
    return this.usersService.updatePassword(id, password);
  }

  @Post(':id/branch')
  @RequirePermissions('users.manage')
  assignBranch(
    @Param('id') userId: string,
    @Body('branchId') branchId: string,
    @Body('roleId') roleId: string,
  ) {
    return this.usersService.assignBranch(userId, branchId, roleId);
  }

  @Delete(':id')
  @RequirePermissions('users.manage')
  delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
