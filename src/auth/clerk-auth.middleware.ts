import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { clerkMiddleware } from '@clerk/express';

// Validate Clerk environment variables
const publishableKey = process.env.CLERK_PUBLISHABLE_KEY;
const secretKey = process.env.CLERK_SECRET_KEY;

if (!publishableKey || !secretKey) {
  throw new Error(
    'Clerk credentials are required. Set CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY environment variables.',
  );
}

@Injectable()
export class ClerkAuthMiddleware implements NestMiddleware {
  private clerkMiddleware = clerkMiddleware({
    publishableKey,
    secretKey,
  });

  use(req: Request, res: Response, next: NextFunction) {
    this.clerkMiddleware(req, res, next);
  }
}
