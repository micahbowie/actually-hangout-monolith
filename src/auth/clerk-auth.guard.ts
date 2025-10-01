import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { getAuth } from '@clerk/express';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req; // eslint-disable-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access

    const auth = getAuth(request);

    if (!auth.userId) {
      throw new UnauthorizedException('Authentication required');
    }

    // Attach auth info to request for use in resolvers
    request.auth = auth; // eslint-disable-line @typescript-eslint/no-unsafe-member-access

    return true;
  }
}
