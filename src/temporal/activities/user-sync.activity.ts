/**
 * User sync activities for Temporal workflows
 * These activities handle database mutations and async processing of user lifecycle events
 */

import { Logger } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import type { ClerkUserData } from '../../users/types/clerk-webhook.types';

const logger = new Logger('UserSyncActivity');

// UsersService instance will be injected by the worker
let usersService: UsersService;

export function setUsersService(service: UsersService): void {
  usersService = service;
}

type UpdateUserActivityData = {
  clerkId: string;
  updates: {
    firstName?: string;
    lastName?: string;
    email?: string | null;
    profileImageUrl?: string;
    username?: string | null;
    birthday?: string;
    lastActiveAt?: number;
    lastSignInAt?: number;
    mood?: string;
  };
};

type SessionCreatedActivityData = {
  clerkId: string;
  lastActiveAt: number;
};

export async function createUserActivity(
  clerkUserData: ClerkUserData,
): Promise<void> {
  logger.log(`[Activity] Creating user: ${clerkUserData.id}`);

  if (!usersService) {
    throw new Error('UsersService not initialized in activity context');
  }

  // Create user in database
  const user = await usersService.createUser(clerkUserData);

  logger.log(`[Activity] User created: ${user.id}`);

  // Future: Add additional business logic like:
  // - await sendWelcomeEmail(user.email);
  // - await createDefaultPreferences(user.id);
  // - await trackAnalytics('user_created', { userId: user.id });
  // - await notifyOtherServices(user);
}

export async function updateUserActivity(
  data: UpdateUserActivityData,
): Promise<void> {
  logger.log(`[Activity] Updating user: ${data.clerkId}`);

  if (!usersService) {
    throw new Error('UsersService not initialized in activity context');
  }

  // Update user in database
  const user = await usersService.updateUser(data.clerkId, data.updates);

  if (!user) {
    logger.warn(`[Activity] User not found: ${data.clerkId}`);
    return;
  }

  logger.log(`[Activity] User updated: ${user.id}`);

  // Future: Add additional business logic like:
  // - await syncToExternalSystems(user);
  // - await updateSearchIndex(user);
  // - await invalidateCaches(user.id);
  // - await trackAnalytics('user_updated', { userId: user.id });
}

export async function deleteUserActivity(clerkId: string): Promise<void> {
  logger.log(`[Activity] Deleting user: ${clerkId}`);

  if (!usersService) {
    throw new Error('UsersService not initialized in activity context');
  }

  // Get user before deletion for any cleanup operations
  const user = await usersService.getUserByClerkId(clerkId);
  if (!user) {
    logger.warn(`[Activity] User not found for deletion: ${clerkId}`);
    return;
  }

  const userId = user.id;
  const userUuid = user.uuid;

  // Delete user from database (hard delete with cascade)
  await usersService.deleteUser(clerkId);

  logger.log(`[Activity] User deleted: ${userId}`);

  // Future: Add cleanup logic like:
  // - await removeFromExternalSystems(userUuid);
  // - await cleanupS3Assets(userUuid);
  // - await archiveUserData(userId);
  // - await cancelSubscriptions(userId);
  // - await trackAnalytics('user_deleted', { userId });

  // Note: userUuid preserved for future cleanup operations
  void userUuid;
}

export async function updateUserSessionActivity(
  data: SessionCreatedActivityData,
): Promise<void> {
  logger.log(`[Activity] Updating user session: ${data.clerkId}`);

  if (!usersService) {
    throw new Error('UsersService not initialized in activity context');
  }

  // Update user's last active and sign in timestamps
  const user = await usersService.updateUser(data.clerkId, {
    lastActiveAt: data.lastActiveAt,
    lastSignInAt: data.lastActiveAt,
  });

  if (!user) {
    logger.error(
      `[Activity] User not found for session update: ${data.clerkId}`,
    );
    return;
  }

  logger.log(`[Activity] User session updated: ${user.id}`);

  // Future: Add additional business logic like:
  // - await trackLoginAnalytics(user.id, data.lastActiveAt);
  // - await checkForSuspiciousActivity(user.id);
  // - await updateActivityMetrics(user.id);
  // - await triggerEngagementCampaigns(user.id);
}
