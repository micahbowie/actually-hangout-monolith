import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { TemporalService } from '../temporal/temporal.service';

@Injectable()
export class TemporalHealthIndicator extends HealthIndicator {
  constructor(private readonly temporalService: TemporalService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isHealthy = await this.temporalService.isHealthy();

    const result = this.getStatus(key, isHealthy);

    if (isHealthy) {
      return result;
    }

    throw new HealthCheckError('Temporal health check failed', result);
  }
}
