import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      time: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
