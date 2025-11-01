import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RequestContextService } from './request-context.service';

/**
 * Request ID Middleware
 *
 * Extracts or generates request ID and correlation ID from headers:
 * - X-Request-ID: Unique per HTTP request (generated if not provided)
 * - X-Correlation-ID: Tracks logical operations across requests (optional)
 *
 * Both IDs are:
 * - Stored in AsyncLocalStorage for access throughout the request
 * - Added to response headers
 * - Included in all logs via the logging interceptor
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract or generate request ID
    // Check headers from proxy/load balancer first
    const requestId =
      (req.headers['x-request-id'] as string) ||
      (req.headers['x-amzn-trace-id'] as string) || // AWS ALB trace ID
      uuidv4();

    // Extract correlation ID if provided
    // This allows clients to track operations across multiple requests
    const correlationId = req.headers['x-correlation-id'] as string | undefined;

    // Set headers in response for client tracking
    res.setHeader('x-request-id', requestId);
    if (correlationId) {
      res.setHeader('x-correlation-id', correlationId);
    }

    // Store both IDs in AsyncLocalStorage for request isolation
    RequestContextService.run(
      {
        requestId,
        correlationId,
      },
      () => {
        next();
      },
    );
  }
}
