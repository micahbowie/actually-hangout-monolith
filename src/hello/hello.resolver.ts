import { Query, Resolver } from '@nestjs/graphql';
import { Logger, UseGuards } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Hello } from './models/hello.model';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthObject } from '../auth/types/auth.types';
import { TemporalService } from '../temporal/temporal.service';
import { helloWorkflow } from '../temporal/workflows';
class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

@Resolver(() => Hello)
export class HelloResolver {
  private readonly logger = new Logger(HelloResolver.name);

  constructor(private readonly temporalService: TemporalService) {}

  @Query(() => Hello, { name: 'hello' })
  async getHello(): Promise<Hello> {
    this.logger.log('saying hello');

    try {
      const client = await this.temporalService.getClient();
      const workflowId = `hello-workflow-${uuidv4()}`;

      const handle = await client.workflow.start(helloWorkflow, {
        args: ['GraphQL Query (anonymous)'],
        workflowId,
        taskQueue: 'actually-core-logic',
        workflowExecutionTimeout: '2m',
      });

      this.logger.log(`Started Temporal workflow with ID: ${workflowId}`);

      const TIMEOUT_MS = 15000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new TimeoutError('Workflow timeout')),
          TIMEOUT_MS,
        );
      });

      try {
        const result = await Promise.race([handle.result(), timeoutPromise]);
        return { message: result };
      } catch (error) {
        if (error instanceof TimeoutError) {
          this.logger.error(
            `Workflow timed out, attempting to cancel: ${workflowId}`,
          );
          try {
            await handle.cancel();
          } catch (cancelError) {
            this.logger.error('Failed to cancel workflow:', cancelError);
          }
          return {
            message: 'Hello World! (Workflow timed out, returning fallback)',
          };
        } else {
          throw error;
        }
      }
    } catch (error) {
      this.logger.error('Failed to execute Temporal workflow:', error);
      return {
        message: 'Hello World! (Workflow failed, returning fallback)',
      };
    }
  }

  @Query(() => Hello, { name: 'helloAuth' })
  @UseGuards(ClerkAuthGuard)
  async getHelloAuth(@CurrentUser() auth: AuthObject): Promise<Hello> {
    const userInfo = `authenticated as ${auth.userId}`;

    try {
      const client = await this.temporalService.getClient();
      const workflowId = `hello-workflow-${uuidv4()}`;

      const handle = await client.workflow.start(helloWorkflow, {
        args: [`GraphQL Query (${userInfo})`],
        workflowId,
        taskQueue: 'actually-core-logic',
        workflowExecutionTimeout: '2m',
      });

      this.logger.log(`Started Temporal workflow with ID: ${workflowId}`);

      const TIMEOUT_MS = 15000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new TimeoutError('Workflow timeout')),
          TIMEOUT_MS,
        );
      });

      try {
        const result = await Promise.race([handle.result(), timeoutPromise]);
        return { message: result };
      } catch (error) {
        if (error instanceof TimeoutError) {
          this.logger.error(
            `Workflow timed out, attempting to cancel: ${workflowId}`,
          );
          try {
            await handle.cancel();
          } catch (cancelError) {
            this.logger.error('Failed to cancel workflow:', cancelError);
          }
          return {
            message: `Hello authenticated user! Your user ID is: ${auth.userId} (Workflow timed out)`,
          };
        } else {
          throw error;
        }
      }
    } catch (error) {
      this.logger.error('Failed to execute Temporal workflow:', error);
      return {
        message: `Hello authenticated user! Your user ID is: ${auth.userId} (Workflow failed)`,
      };
    }
  }
}
