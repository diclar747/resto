import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

class OpenRegisterDto {
  branchId: string;
  cashierId: string;
  openingBalance: number;
}

class CloseRegisterDto {
  registerId: string;
  actualBalance: number;
}

class AddMovementDto {
  registerId: string;
  type: string;
  amount: number;
  description?: string;
  paymentId?: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cash-register')
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  /**
   * POST /cash-register/open
   * Open a new cash register session for a branch.
   */
  @Post('open')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('cash_register:open')
  openRegister(@Body() dto: OpenRegisterDto) {
    return this.cashRegisterService.openRegister(
      dto.branchId,
      dto.cashierId,
      dto.openingBalance,
    );
  }

  /**
   * POST /cash-register/close
   * Close an open cash register, recording the actual balance and difference.
   */
  @Post('close')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('cash_register:close')
  closeRegister(@Body() dto: CloseRegisterDto) {
    return this.cashRegisterService.closeRegister(
      dto.registerId,
      dto.actualBalance,
    );
  }

  /**
   * GET /cash-register/current?branchId=
   * Get the currently open register for a branch.
   */
  @Get('current')
  @RequirePermissions('cash_register:read')
  getCurrentRegister(@Query('branchId') branchId: string) {
    return this.cashRegisterService.getCurrentRegister(branchId);
  }

  /**
   * POST /cash-register/movement
   * Add a manual movement (cash in/out, expense, etc.) to an open register.
   */
  @Post('movement')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('cash_register:movement')
  addMovement(@Body() dto: AddMovementDto) {
    return this.cashRegisterService.addMovement(
      dto.registerId,
      dto.type,
      dto.amount,
      dto.description,
      dto.paymentId,
    );
  }

  /**
   * GET /cash-register/:id/movements
   * List all movements for a specific cash register.
   */
  @Get(':id/movements')
  @RequirePermissions('cash_register:read')
  getMovements(@Param('id') id: string) {
    return this.cashRegisterService.getMovements(id);
  }

  /**
   * GET /cash-register/summary?branchId=&date=
   * Get a daily summary of payments and cash movements for a branch.
   * Date format: YYYY-MM-DD (defaults to today if omitted).
   */
  @Get('summary')
  @RequirePermissions('cash_register:read')
  getDailySummary(
    @Query('branchId') branchId: string,
    @Query('date') date?: string,
  ) {
    const targetDate = date ? new Date(date) : new Date();
    return this.cashRegisterService.getDailySummary(branchId, targetDate);
  }
}
