import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { TemporalHealthIndicator } from './temporal-health.indicator';
import { RedisHealthIndicator } from './redis-health.indicator';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private temporal: TemporalHealthIndicator,
    private redis: RedisHealthIndicator,
  ) {}

  @Get('_details')
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.temporal.isHealthy('temporal'),
      () => this.redis.isHealthy('redis'),
    ]);
  }

  // Optional: Separate ping endpoint
  @Get('ping')
  ping() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
