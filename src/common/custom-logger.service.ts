import { ConsoleLogger, Injectable, LogLevel } from '@nestjs/common';
import { RequestContextService } from './request-context.service';

@Injectable()
export class CustomLogger extends ConsoleLogger {
  log(message: unknown, ...optionalParams: unknown[]): void {
    this.logWithRequestId('log', message, ...optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.logWithRequestId('error', message, ...optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.logWithRequestId('warn', message, ...optionalParams);
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.logWithRequestId('debug', message, ...optionalParams);
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.logWithRequestId('verbose', message, ...optionalParams);
  }

  private logWithRequestId(
    level: LogLevel,
    message: unknown,
    ...optionalParams: unknown[]
  ): void {
    const requestId = RequestContextService.getRequestId();

    if (this.options.json) {
      // For JSON logging, add requestId to the log object
      const logObject =
        typeof message === 'string'
          ? { message }
          : typeof message === 'object' && message !== null
            ? (message as Record<string, unknown>)
            : { message };

      const enrichedLog = {
        level,
        timestamp: new Date().toISOString(),
        requestId,
        ...logObject,
        context: optionalParams[optionalParams.length - 1] || undefined,
      };

      // Use console methods directly for JSON output

      console.log(JSON.stringify(enrichedLog));
    } else {
      // For non-JSON logging, include requestId in the message
      const prefix = requestId ? `[${requestId}] ` : '';
      const formattedMessage =
        typeof message === 'string' ? `${prefix}${message}` : message;

      super[level](formattedMessage, ...optionalParams);
    }
  }
}
