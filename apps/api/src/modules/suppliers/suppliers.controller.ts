import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  // ----------------------------------------------------------------
  // Suppliers CRUD
  // ----------------------------------------------------------------

  @Get()
  @RequirePermissions('suppliers:read')
  findAll(@Query('branchId') branchId?: string) {
    return this.suppliersService.findAll(branchId);
  }

  @Get(':id')
  @RequirePermissions('suppliers:read')
  findById(@Param('id') id: string) {
    return this.suppliersService.findById(id);
  }

  @Post()
  @RequirePermissions('suppliers:write')
  create(
    @Body()
    body: {
      name: string;
      contactName?: string;
      email?: string;
      phone?: string;
      address?: string;
      taxId?: string;
      notes?: string;
      branchIds?: string[];
    },
  ) {
    return this.suppliersService.create(body);
  }

  @Put(':id')
  @RequirePermissions('suppliers:write')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      contactName?: string;
      email?: string;
      phone?: string;
      address?: string;
      taxId?: string;
      notes?: string;
      branchIds?: string[];
    },
  ) {
    return this.suppliersService.update(id, body);
  }

  @Delete(':id')
  @RequirePermissions('suppliers:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.suppliersService.delete(id);
  }

  // ----------------------------------------------------------------
  // Purchase Orders
  // ----------------------------------------------------------------

  @Post('purchase-orders')
  @RequirePermissions('suppliers:write')
  createPurchaseOrder(
    @Body()
    body: {
      supplierId: string;
      branchId: string;
      items: { ingredientId: string; quantity: number; unitPrice: number }[];
      notes?: string;
      expectedDate?: string;
    },
  ) {
    return this.suppliersService.createPurchaseOrder(body);
  }

  @Post('purchase-orders/:id/receive')
  @RequirePermissions('suppliers:write')
  receivePurchaseOrder(
    @Param('id') id: string,
    @Body()
    body: {
      items: { ingredientId: string; receivedQty: number }[];
    },
  ) {
    return this.suppliersService.receivePurchaseOrder(id, body.items);
  }

  @Get('purchase-orders')
  @RequirePermissions('suppliers:read')
  findPurchaseOrders(
    @Query('branchId') branchId: string,
    @Query('supplierId') supplierId?: string,
    @Query('status') status?: string,
  ) {
    return this.suppliersService.findPurchaseOrders(branchId, supplierId, status);
  }

  // ----------------------------------------------------------------
  // Accounts Payable
  // ----------------------------------------------------------------

  @Get('accounts-payable')
  @RequirePermissions('suppliers:read')
  findAccountsPayable(
    @Query('branchId') branchId: string,
    @Query('status') status?: string,
  ) {
    return this.suppliersService.findAccountsPayable(branchId, status);
  }

  @Post('accounts-payable/:id/pay')
  @RequirePermissions('suppliers:write')
  payAccount(
    @Param('id') id: string,
    @Body() body: { amount: number },
  ) {
    return this.suppliersService.payAccount(id, body.amount);
  }
}
