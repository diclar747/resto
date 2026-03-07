import { Controller, Get } from '@nestjs/common';
import { ModifiersService } from './modifiers.service';

@Controller('modifiers')
export class ModifiersController {
  constructor(private modifiersService: ModifiersService) {}

  @Get()
  async findAll() {
    return this.modifiersService.findAll();
  }
}
