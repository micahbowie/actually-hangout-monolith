import { Mutation, Resolver, Args } from '@nestjs/graphql';
import { Logger, UseGuards } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as Sentry from '@sentry/nestjs';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthObject } from '../auth/types/auth.types';
import { TemporalService } from '../temporal/temporal.service';
import { PushTokenInput } from './dto/push-token.input';
import { updatePushTokenWorkflow } from '../temporal/workflows';

@Resolver()
export class UsersResolver {
  private readonly logger = new Logger(UsersResolver.name);

  constructor(private readonly temporalService: TemporalService) {}

  @Mutation(() => Boolean, {
    name: 'updateUserPushToken',
    description:
      'Updates the push notification token for the authenticated user. Accepts Expo, FCM, and APNs token formats.',
  })
  @UseGuards(ClerkAuthGuard)
  async updateUserPushToken(
    @CurrentUser() auth: AuthObject,
    @Args('input') input: PushTokenInput,
  ): Promise<boolean> {
    this.logger.log({
      message: 'Updating user push token',
      userId: auth.userId,
      tokenLength: input.token.length,
    });

    const workflowId = `update-push-token-${auth.userId}-${uuidv4()}`;

    try {
      const client = await this.temporalService.getClient();

      // Start workflow asynchronously (fire-and-forget)
      await client.workflow.start(updatePushTokenWorkflow, {
        args: [
          {
            userId: auth.userId,
            pushToken: input.token,
          },
        ],
        workflowId,
        taskQueue: 'actually-core-logic',
        workflowExecutionTimeout: '1m',
      });

      this.logger.log({
        message: 'Push token workflow started',
        workflowId,
        userId: auth.userId,
      });

      return true;
    } catch (error) {
      this.logger.error({
        message: 'Failed to start push token workflow',
        userId: auth.userId,
        workflowId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Capture error in Sentry for monitoring
      Sentry.captureException(error, {
        extra: {
          userId: auth.userId,
          workflowId,
          tokenLength: input.token.length,
        },
      });

      throw new Error(
        `Failed to update push token: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
