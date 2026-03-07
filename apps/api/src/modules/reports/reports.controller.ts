import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@RequirePermissions('reports.view')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * GET /reports/sales?branchId=&from=&to=&groupBy=hour|day
   */
  @Get('sales')
  salesByPeriod(
    @Query('branchId') branchId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('groupBy') groupBy: 'hour' | 'day' = 'day',
  ) {
    this.requireParams({ branchId, from, to });
    return this.reportsService.salesByPeriod(
      branchId,
      new Date(from),
      new Date(to),
      groupBy,
    );
  }

  /**
   * GET /reports/products?branchId=&from=&to=
   */
  @Get('products')
  salesByProduct(
    @Query('branchId') branchId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    this.requireParams({ branchId, from, to });
    return this.reportsService.salesByProduct(
      branchId,
      new Date(from),
      new Date(to),
    );
  }

  /**
   * GET /reports/waiters?branchId=&from=&to=
   */
  @Get('waiters')
  salesByWaiter(
    @Query('branchId') branchId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    this.requireParams({ branchId, from, to });
    return this.reportsService.salesByWaiter(
      branchId,
      new Date(from),
      new Date(to),
    );
  }

  /**
   * GET /reports/payment-methods?branchId=&from=&to=
   */
  @Get('payment-methods')
  salesByPaymentMethod(
    @Query('branchId') branchId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    this.requireParams({ branchId, from, to });
    return this.reportsService.salesByPaymentMethod(
      branchId,
      new Date(from),
      new Date(to),
    );
  }

  /**
   * GET /reports/prep-time?branchId=&from=&to=
   */
  @Get('prep-time')
  averagePrepTime(
    @Query('branchId') branchId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    this.requireParams({ branchId, from, to });
    return this.reportsService.averagePrepTime(
      branchId,
      new Date(from),
      new Date(to),
    );
  }

  /**
   * GET /reports/ingredients?branchId=&from=&to=
   */
  @Get('ingredients')
  ingredientConsumption(
    @Query('branchId') branchId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    this.requireParams({ branchId, from, to });
    return this.reportsService.ingredientConsumption(
      branchId,
      new Date(from),
      new Date(to),
    );
  }

  /**
   * GET /reports/daily-summary?branchId=&date=
   */
  @Get('daily-summary')
  dailySummary(
    @Query('branchId') branchId: string,
    @Query('date') date: string,
  ) {
    this.requireParams({ branchId, date });
    return this.reportsService.dailySummary(branchId, new Date(date));
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private requireParams(params: Record<string, string | undefined>) {
    const missing = Object.entries(params)
      .filter(([, v]) => !v)
      .map(([k]) => k);
    if (missing.length > 0) {
      throw new BadRequestException(
        `Parámetros requeridos faltantes: ${missing.join(', ')}`,
      );
    }
  }
}
