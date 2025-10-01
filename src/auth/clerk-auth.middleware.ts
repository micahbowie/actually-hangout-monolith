import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { clerkMiddleware } from '@clerk/express';

@Injectable()
export class ClerkAuthMiddleware implements NestMiddleware {
  private clerkMiddleware = clerkMiddleware({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  use(req: Request, res: Response, next: NextFunction) {
    this.clerkMiddleware(req, res, next);
  }
}
