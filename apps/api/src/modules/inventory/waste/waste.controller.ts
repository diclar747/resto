import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WasteService } from './waste.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@Controller('inventory/waste')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WasteController {
  constructor(private wasteService: WasteService) {}

  @Post()
  @RequirePermissions('inventory.manage')
  recordWaste(
    @Body()
    body: {
      ingredientId: string;
      branchId: string;
      quantity: number;
      reason: string;
      recordedBy: string;
    },
  ) {
    return this.wasteService.recordWaste(
      body.ingredientId,
      body.branchId,
      body.quantity,
      body.reason,
      body.recordedBy,
    );
  }

  @Get()
  @RequirePermissions('inventory.view')
  findAll(
    @Query('branchId') branchId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.wasteService.findAll(branchId, from, to);
  }
}
