import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface GraphQLRequestBody {
  query?: string;
  operationName?: string;
  variables?: Record<string, unknown>;
}

@Injectable()
export class GraphQLLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('GraphQL');

  use(req: Request, _res: Response, next: NextFunction) {
    const body = req.body as GraphQLRequestBody;

    if (body?.query) {
      const operationType = this.extractOperationType(body.query);
      const operationName =
        body.operationName || this.extractOperationName(body.query);
      const variables = body.variables ? Object.keys(body.variables) : [];

      const logData = {
        operationType,
        operationName,
        variables,
        path: req.path,
        method: req.method,
      };

      this.logger.log(logData);
    }

    next();
  }

  private extractOperationType(query: string): string | null {
    const operationMatch = query.match(/^\s*(query|mutation|subscription)/i);
    return operationMatch ? operationMatch[1].toLowerCase() : null;
  }

  private extractOperationName(query: string): string | null {
    const nameMatch = query.match(
      /^\s*(?:query|mutation|subscription)\s+(\w+)/i,
    );
    return nameMatch ? nameMatch[1] : null;
  }
}
