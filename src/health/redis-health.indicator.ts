import { Injectable, Inject } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Try to set and get a test value to verify Redis is working
      const testKey = '__health_check__';
      const testValue = Date.now().toString();

      await this.cacheManager.set(testKey, testValue, 1000);
      const retrievedValue = await this.cacheManager.get(testKey);

      const isHealthy = retrievedValue === testValue;

      // Clean up test key
      await this.cacheManager.del(testKey);

      const result = this.getStatus(key, isHealthy);

      if (isHealthy) {
        return result;
      }

      throw new HealthCheckError('Redis health check failed', result);
    } catch (error) {
      const result = this.getStatus(key, false, {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new HealthCheckError('Redis health check failed', result);
    }
  }
}
