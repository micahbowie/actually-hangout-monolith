import { CacheInterceptor } from '@nestjs/cache-manager';
import { ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const contextType = context.getType<'http' | 'graphql'>();

    // Only cache HTTP requests, not GraphQL
    if (contextType !== 'http') {
      return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();
    const { httpAdapter } = this.httpAdapterHost;

    // Exclude health endpoints from caching
    if (
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      request?.url?.startsWith('/health') ||
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      request?.path?.startsWith('/health')
    ) {
      return undefined;
    }

    // For HTTP requests, use the default URL-based tracking
    const isHttpApp = httpAdapter && !!httpAdapter.getRequestUrl;
    if (isHttpApp && request) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return httpAdapter.getRequestUrl(request);
    }

    return undefined;
  }
}
