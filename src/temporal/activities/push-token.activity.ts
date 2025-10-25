/**
 * Push token activities for Temporal workflows
 * These activities handle updating user push notification tokens
 */

import { Logger } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { UsersService } from '../../users/users.service';

// Activity logger
const logger = new Logger('PushTokenActivity');

// UsersService instance will be injected by the worker
let usersService: UsersService;

export function setUsersServiceForPushToken(service: UsersService): void {
  usersService = service;
}

type UpdatePushTokenActivityData = {
  userId: string;
  pushToken: string;
};

/**
 * Updates the push token for a user
 * This activity is idempotent - calling it multiple times with the same token will not create duplicates
 */
export async function updatePushTokenActivity(
  data: UpdatePushTokenActivityData,
): Promise<boolean> {
  logger.log({
    message: 'Updating push token',
    userId: data.userId,
    tokenLength: data.pushToken.length,
  });

  if (!usersService) {
    const error = new Error('UsersService not initialized in activity context');
    logger.error({
      message: 'UsersService not initialized',
      userId: data.userId,
    });
    throw error;
  }

  // Validate input
  if (!data.userId || !data.pushToken) {
    logger.error({
      message: 'Invalid input data',
      hasUserId: !!data.userId,
      hasPushToken: !!data.pushToken,
    });
    return false;
  }

  try {
    // Update push token through service
    const success = await usersService.updatePushToken(
      data.userId,
      data.pushToken,
    );

    if (success) {
      logger.log({
        message: 'Push token updated successfully',
        userId: data.userId,
      });
    } else {
      logger.warn({
        message: 'Push token update returned false',
        userId: data.userId,
      });
    }

    return success;
  } catch (error) {
    logger.error({
      message: 'Error updating push token',
      userId: data.userId,
      error: error instanceof Error ? error.message : String(error),
    });

    // Capture error in Sentry for monitoring
    Sentry.captureException(error, {
      extra: {
        userId: data.userId,
        pushTokenLength: data.pushToken?.length || 0,
      },
    });

    throw error;
  }
}
