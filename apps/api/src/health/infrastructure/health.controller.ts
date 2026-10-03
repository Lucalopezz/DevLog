import { Controller, Get, Header } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  @Header('Cache-Control', 'no-store')
  getHealth() {
    // This liveness check only confirms that HTTP is available. It stays public
    // and avoids database queries so visitors can wake the API cheaply.
    return { status: 'ok' };
  }
}
