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
          const statusCode = this.getActualStatusCode(context);
          this.logResponse(
            method,
            url,
            operationName,
            responseTime,
            statusCode,
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

      // Extract operation name from operation definition, fall back to field name

      const operationName =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (info.operation?.name?.value as string | undefined) ||
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (info.fieldName as string);

      return {
        method: 'GRAPHQL',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        url: (request?.url as string) || '/graphql',
        operationName,
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

  private getActualStatusCode(context: ExecutionContext): number {
    if (context.getType<string>() === 'graphql') {
      return 200;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const response = context.switchToHttp().getResponse();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return response?.statusCode ?? 200;
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
    const { requestId, correlationId } = RequestContextService.getContext();

    const logData = {
      method,
      url,
      ...(operationName && { operationName }),
      statusCode,
      responseTime,
      requestType,
      requestId,
      correlationId,
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
