import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RequestContextService } from './request-context.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startTime = Date.now();
    const requestType = context.getType();

    // Get request info based on context type
    const { method, url, operationName } = this.getRequestInfo(
      context,
      requestType,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - startTime;
          this.logResponse(
            method,
            url,
            operationName,
            responseTime,
            200,
            requestType as string,
          );
        },
        error: (error: Error) => {
          const responseTime = Date.now() - startTime;
          const statusCode = this.getStatusCode(error);
          this.logResponse(
            method,
            url,
            operationName,
            responseTime,
            statusCode,
            requestType as string,
            error,
          );
        },
      }),
    );
  }

  private getRequestInfo(
    context: ExecutionContext,
    requestType: string,
  ): { method: string; url: string; operationName?: string } {
    if (requestType === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const info = gqlContext.getInfo();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const request = gqlContext.getContext().req;

      return {
        method: 'GRAPHQL',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        url: (request?.url as string) || '/graphql',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        operationName: info.fieldName as string,
      };
    }

    // HTTP context
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();
    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      method: request.method as string,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      url: request.url as string,
    };
  }

  private getStatusCode(error: unknown): number {
    if (typeof error === 'object' && error !== null && 'status' in error) {
      return (error as { status: number }).status;
    }
    return 500;
  }

  private logResponse(
    method: string,
    url: string,
    operationName: string | undefined,
    responseTime: number,
    statusCode: number,
    requestType: string,
    error?: Error,
  ): void {
    const requestId = RequestContextService.getRequestId();

    const logData = {
      method,
      url,
      ...(operationName && { operationName }),
      statusCode,
      responseTime,
      requestType,
      requestId,
      ...(error && { error: error.message }),
    };

    if (statusCode >= 500) {
      this.logger.error(logData);
    } else if (statusCode >= 400) {
      this.logger.warn(logData);
    } else {
      this.logger.log(logData);
    }
  }
}
