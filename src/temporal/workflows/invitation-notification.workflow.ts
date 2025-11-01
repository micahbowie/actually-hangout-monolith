import { proxyActivities, log } from '@temporalio/workflow';
import type * as activities from '../activities';

// Proxy activities with appropriate timeouts and retry policies
const {
  sendInvitationAcceptedNotification,
  createCollaboratorFromInvitation,
  logInvitationAcceptanceEvent,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '1m',
  retry: {
    maximumAttempts: 3,
    initialInterval: '1s',
    maximumInterval: '10s',
    backoffCoefficient: 2,
  },
});

export type InvitationAcceptedWorkflowData = {
  invitationId: number;
  hangoutId: number;
  inviteeId: number;
  inviterId: number;
  hangoutCreatorId: number;
  hangoutTitle: string;
  collaborationMode: boolean;
  correlationId?: string;
};

/**
 * Workflow: Handle invitation accepted event
 *
 * This workflow orchestrates the following activities when an invitation is accepted:
 * 1. Send notification to hangout creator
 * 2. Create collaborator record (if hangout is in collaboration mode)
 * 3. Log acceptance event for analytics
 *
 * The workflow is designed to be idempotent - activities check for existing state
 * and can be safely retried.
 *
 * CURRENT STATUS: MOCK IMPLEMENTATION
 * All activities currently log intentions rather than performing real actions.
 * This provides the workflow structure for future implementation.
 *
 * @param data - Invitation and hangout details
 * @returns Summary of actions taken
 */
export async function invitationAcceptedWorkflow(
  data: InvitationAcceptedWorkflowData,
): Promise<{
  notificationSent: boolean;
  collaboratorCreated: boolean;
  eventLogged: boolean;
}> {
  const correlationId =
    data.correlationId || `inv-${data.invitationId}-${Date.now()}`;

  log.info('Starting invitation accepted workflow', {
    invitationId: data.invitationId,
    hangoutId: data.hangoutId,
    correlationId,
  });

  try {
    // Activity 1: Send notification to hangout creator
    // This is idempotent - notification service should deduplicate
    log.info('Sending invitation accepted notification', { correlationId });
    const notificationSent = await sendInvitationAcceptedNotification({
      ...data,
      correlationId,
    });

    // Activity 2: Create collaborator if needed
    // This is idempotent - checks if collaborator already exists
    log.info('Creating collaborator from invitation', { correlationId });
    const collaboratorResult = await createCollaboratorFromInvitation({
      ...data,
      correlationId,
    });
    const collaboratorCreated = collaboratorResult !== null;

    // Activity 3: Log event for analytics
    // This is idempotent - analytics service should deduplicate events
    log.info('Logging invitation acceptance event', { correlationId });
    const eventLogged = await logInvitationAcceptanceEvent({
      ...data,
      correlationId,
    });

    log.info('Invitation accepted workflow completed successfully', {
      invitationId: data.invitationId,
      correlationId,
      notificationSent,
      collaboratorCreated,
      eventLogged,
    });

    return {
      notificationSent,
      collaboratorCreated,
      eventLogged,
    };
  } catch (error) {
    log.error('Invitation accepted workflow failed', {
      invitationId: data.invitationId,
      correlationId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Future workflows to implement:
 *
 * 1. invitationDeclinedWorkflow()
 *    - Notify creator of decline
 *    - Log decline event
 *    - Update attendance estimates
 *
 * 2. invitationExpiredWorkflow()
 *    - Send reminder if still pending near hangout date
 *    - Update invitation status
 *
 * 3. collaboratorAddedWorkflow()
 *    - Send welcome notification to new collaborator
 *    - Provide context about hangout
 *    - Log addition event
 */
