import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentsService, PaymentInput } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

class PaymentInputDto {
  @IsString()
  method: string;

  @IsNumber()
  amount: number;
}

class ProcessPaymentDto {
  @IsString()
  orderId: string;

  @IsString()
  method: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsNumber()
  receivedAmount?: number;
}

class SplitPaymentDto {
  @IsString()
  orderId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentInputDto)
  payments: PaymentInput[];
}

class RefundPaymentDto {
  @IsOptional()
  @IsNumber()
  amount?: number;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * POST /payments
   * Process a single payment for an order.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('payments:create')
  processPayment(@Body() dto: ProcessPaymentDto) {
    return this.paymentsService.processPayment(
      dto.orderId,
      dto.method,
      dto.amount,
      dto.receivedAmount,
    );
  }

  /**
   * POST /payments/split
   * Process a split payment (multiple methods) for a single order.
   */
  @Post('split')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('payments:create')
  splitPayment(@Body() dto: SplitPaymentDto) {
    return this.paymentsService.splitPayment(dto.orderId, dto.payments);
  }

  /**
   * POST /payments/:id/refund
   * Refund a payment fully or partially.
   */
  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('payments:refund')
  refundPayment(@Param('id') id: string, @Body() dto: RefundPaymentDto) {
    return this.paymentsService.refundPayment(id, dto.amount);
  }

  /**
   * GET /payments/order/:orderId
   * Retrieve all payments for a given order.
   */
  @Get('order/:orderId')
  @RequirePermissions('payments:read')
  findByOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.findByOrder(orderId);
  }
}
