import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { TemporalHealthIndicator } from './temporal-health.indicator';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private temporal: TemporalHealthIndicator,
  ) {}

  @Get('_details')
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.temporal.isHealthy('temporal'),
    ]);
  }

  // Optional: Separate ping endpoint
  @Get('ping')
  ping() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
