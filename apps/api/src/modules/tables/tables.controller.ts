import { Controller, Get } from '@nestjs/common';
import { TablesService } from './tables.service';

@Controller('tables')
export class TablesController {
  constructor(private tablesService: TablesService) {}

  @Get()
  async findAll() {
    return this.tablesService.findAll();
  }
}
