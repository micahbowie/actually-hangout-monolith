import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities';

const { updatePushTokenActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1m',
  retry: {
    maximumAttempts: 3,
    initialInterval: '1s',
    maximumInterval: '10s',
    backoffCoefficient: 2,
  },
});

type UpdatePushTokenWorkflowData = {
  userId: string;
  pushToken: string;
};

/**
 * Workflow for updating a user's push notification token
 * This workflow ensures idempotent handling of push token updates
 */
export async function updatePushTokenWorkflow(
  data: UpdatePushTokenWorkflowData,
): Promise<boolean> {
  // Execute the update push token activity
  const success = await updatePushTokenActivity(data);
  return success;
}
