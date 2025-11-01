import { Logger } from '@nestjs/common';

const logger = new Logger('InvitationNotificationActivity');

export type InvitationAcceptedData = {
  invitationId: number;
  hangoutId: number;
  inviteeId: number;
  inviterId: number;
  hangoutCreatorId: number;
  hangoutTitle: string;
  collaborationMode: boolean;
  correlationId?: string;
};

export type CollaboratorCreatedData = {
  hangoutId: number;
  userId: number;
  role: string;
  invitedBy: number;
  correlationId?: string;
};

/**
 * Activity: Send notification when invitation is accepted
 * TODO: Integrate with actual notification service (e.g., Expo push notifications)
 *
 * This is currently a mock implementation that logs the notification.
 * Future implementation will:
 * 1. Query user's notification preferences
 * 2. Format notification message
 * 3. Send via Expo push notification service
 * 4. Track delivery status
 */
export async function sendInvitationAcceptedNotification(
  data: InvitationAcceptedData,
): Promise<boolean> {
  logger.log({
    message: 'Sending invitation accepted notification',
    invitationId: data.invitationId,
    hangoutId: data.hangoutId,
    inviteeId: data.inviteeId,
    hangoutCreatorId: data.hangoutCreatorId,
    correlationId: data.correlationId,
    notificationType: 'invitation_accepted',
  });

  // TODO: Actual notification logic here
  // Example:
  // const pushToken = await getUserPushToken(data.hangoutCreatorId);
  // await sendPushNotification(pushToken, {
  //   title: 'Invitation Accepted!',
  //   body: `Someone accepted your invitation to "${data.hangoutTitle}"`,
  //   data: { hangoutId: data.hangoutId }
  // });

  logger.log({
    message: 'Invitation accepted notification sent (mocked)',
    hangoutCreatorId: data.hangoutCreatorId,
    correlationId: data.correlationId,
    mockNotification: {
      title: 'Invitation Accepted!',
      body: `Someone accepted your invitation to "${data.hangoutTitle}"`,
      data: { hangoutId: data.hangoutId },
    },
  });

  return true;
}

/**
 * Activity: Create collaborator record when invitation is accepted
 * This activity is idempotent - it checks if collaborator already exists
 *
 * TODO: Connect to actual HangoutsService
 * Currently mocked with logging only
 */
export async function createCollaboratorFromInvitation(
  data: InvitationAcceptedData,
): Promise<CollaboratorCreatedData | null> {
  logger.log({
    message: 'Checking if should create collaborator from invitation',
    invitationId: data.invitationId,
    hangoutId: data.hangoutId,
    inviteeId: data.inviteeId,
    collaborationMode: data.collaborationMode,
    correlationId: data.correlationId,
  });

  // Only create collaborator if hangout is in collaboration mode
  if (!data.collaborationMode) {
    logger.log({
      message: 'Skipping collaborator creation - not in collaboration mode',
      hangoutId: data.hangoutId,
      correlationId: data.correlationId,
    });
    return null;
  }

  // TODO: Check if collaborator already exists (idempotency)
  // TODO: Call HangoutsService.addCollaborator()
  // For now, just log the intent

  const collaboratorData: CollaboratorCreatedData = {
    hangoutId: data.hangoutId,
    userId: data.inviteeId,
    role: 'collaborator',
    invitedBy: data.inviterId,
    correlationId: data.correlationId,
  };

  logger.log({
    message: 'Collaborator would be created (mocked)',
    ...collaboratorData,
  });

  return collaboratorData;
}

/**
 * Activity: Log invitation acceptance event for analytics
 * This activity is idempotent and tracks acceptance events
 */
export async function logInvitationAcceptanceEvent(
  data: InvitationAcceptedData,
): Promise<boolean> {
  logger.log({
    message: 'Logging invitation acceptance event',
    event: 'invitation_accepted',
    invitationId: data.invitationId,
    hangoutId: data.hangoutId,
    inviteeId: data.inviteeId,
    timestamp: new Date().toISOString(),
    correlationId: data.correlationId,
    metadata: {
      hangoutTitle: data.hangoutTitle,
      collaborationMode: data.collaborationMode,
      inviterId: data.inviterId,
      hangoutCreatorId: data.hangoutCreatorId,
    },
  });

  // TODO: Send to analytics service (e.g., Segment, Mixpanel, PostHog)
  // await analytics.track({
  //   userId: data.inviteeId,
  //   event: 'Invitation Accepted',
  //   properties: { ... }
  // });

  return true;
}
