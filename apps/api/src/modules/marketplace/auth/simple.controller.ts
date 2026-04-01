import { Controller, Get, Post, Body } from '@nestjs/common';

@Controller('simple')
export class SimpleController {
  
  @Get('test')
  test() {
    return { 
      message: 'OK', 
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  @Post('echo')
  echo(@Body() body: any) {
    return {
      received: body,
      timestamp: new Date().toISOString()
    };
  }
}
