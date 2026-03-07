import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { TablesService, TableStatus, CreateTableDto, UpdateTableDto } from './tables.service';
import { TablesGateway } from './tables.gateway';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

// ─── Request body shapes ──────────────────────────────────────────────────────

class UpdateStatusBody {
  status: TableStatus;
}

class MergeTablesBody {
  tableIds: string[];
  targetTableId: string;
}

class SplitTableBody {
  tableId: string;
  itemIds: string[];
  newTableId: string;
}

// ─── Controller ───────────────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tables')
export class TablesController {
  constructor(
    private readonly tablesService: TablesService,
    private readonly tablesGateway: TablesGateway,
  ) {}

  // GET /tables?branchId=
  @Get()
  async findAll(@Query('branchId') branchId: string) {
    if (!branchId) {
      throw new BadRequestException('branchId query parameter is required');
    }
    return this.tablesService.findAll(branchId);
  }

  // GET /tables/:id
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.tablesService.findById(id);
  }

  // POST /tables
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateTableDto) {
    return this.tablesService.create(body);
  }

  // PATCH /tables/:id
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateTableDto) {
    return this.tablesService.update(id, body);
  }

  // DELETE /tables/:id
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    return this.tablesService.delete(id);
  }

  // PATCH /tables/:id/status
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateStatusBody,
  ) {
    if (!body?.status) {
      throw new BadRequestException('status field is required');
    }
    const updated = await this.tablesService.updateStatus(id, body.status);

    // Emit real-time event to all clients watching this branch
    this.tablesGateway.emitTableStatusChanged(updated.branchId, updated);

    return updated;
  }

  // POST /tables/:id/qr-code
  @Post(':id/qr-code')
  @HttpCode(HttpStatus.OK)
  async generateQrCode(@Param('id') id: string) {
    return this.tablesService.generateQrCode(id);
  }

  // POST /tables/merge
  @Post('merge')
  @HttpCode(HttpStatus.OK)
  async mergeTables(@Body() body: MergeTablesBody) {
    if (!body?.tableIds || !body?.targetTableId) {
      throw new BadRequestException('tableIds and targetTableId are required');
    }
    return this.tablesService.mergeTables(body.tableIds, body.targetTableId);
  }

  // POST /tables/split
  @Post('split')
  @HttpCode(HttpStatus.OK)
  async splitTable(@Body() body: SplitTableBody) {
    if (!body?.tableId || !body?.itemIds || !body?.newTableId) {
      throw new BadRequestException('tableId, itemIds, and newTableId are required');
    }
    return this.tablesService.splitTable(body.tableId, body.itemIds, body.newTableId);
  }
}
