import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities';
import type { ClerkUserData } from '../../users/types/clerk-webhook.types';

const {
  createUserActivity,
  updateUserActivity,
  deleteUserActivity,
  updateUserSessionActivity,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '2m',
  retry: {
    maximumAttempts: 3,
  },
});

type UpdateUserWorkflowData = {
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

type SessionCreatedWorkflowData = {
  clerkId: string;
  lastActiveAt: number;
};

/**
 * Workflow for processing user creation events
 */
export async function userCreatedWorkflow(
  clerkUserData: ClerkUserData,
): Promise<void> {
  await createUserActivity(clerkUserData);
}

/**
 * Workflow for processing user update events
 */
export async function userUpdatedWorkflow(
  data: UpdateUserWorkflowData,
): Promise<void> {
  await updateUserActivity(data);
}

/**
 * Workflow for processing user deletion events
 */
export async function userDeletedWorkflow(clerkId: string): Promise<void> {
  await deleteUserActivity(clerkId);
}

/**
 * Workflow for processing session creation events
 */
export async function sessionCreatedWorkflow(
  data: SessionCreatedWorkflowData,
): Promise<void> {
  await updateUserSessionActivity(data);
}
