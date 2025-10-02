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
    // Generate unique test key to avoid collisions
    const testKey = `__health_check__:${process.pid}:${Date.now()}:${Math.random().toString(36).substring(7)}`;

    try {
      // Try to set and get a test value to verify Redis is working
      const testValue = Date.now().toString();

      // Set with 5 second TTL as a safety measure
      await this.cacheManager.set(testKey, testValue, 5000);
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
      // Attempt cleanup even on error
      try {
        await this.cacheManager.del(testKey);
      } catch {
        // Ignore cleanup errors (key will expire via TTL)
      }

      const result = this.getStatus(key, false, {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new HealthCheckError('Redis health check failed', result);
    }
  }
}
