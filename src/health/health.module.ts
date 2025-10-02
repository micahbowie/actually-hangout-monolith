import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { TemporalHealthIndicator } from './temporal-health.indicator';
import { RedisHealthIndicator } from './redis-health.indicator';

@Module({
  controllers: [HealthController],
  imports: [TerminusModule],
  providers: [TemporalHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}
