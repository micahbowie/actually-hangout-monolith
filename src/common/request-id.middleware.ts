import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RequestContextService } from './request-context.service';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Check if request already has an ID (e.g., from a proxy/load balancer)
    const requestId =
      (req.headers['x-request-id'] as string) ||
      (req.headers['x-correlation-id'] as string) ||
      uuidv4();

    // Set the request ID in the response header
    res.setHeader('x-request-id', requestId);

    // Store the request ID in AsyncLocalStorage
    RequestContextService.setRequestContext({ requestId });

    next();
  }
}
