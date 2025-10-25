import { Injectable, Logger } from '@nestjs/common';
import { TemporalService } from '../temporal/temporal.service';
import {
  ClerkWebhookEvent,
  UserCreatedEvent,
  UserUpdatedEvent,
  UserDeletedEvent,
  SessionCreatedEvent,
} from '../users/types/clerk-webhook.types';
import {
  userCreatedWorkflow,
  userUpdatedWorkflow,
  userDeletedWorkflow,
  sessionCreatedWorkflow,
} from '../temporal/workflows/user-sync.workflow';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly temporalService: TemporalService) {}

  /**
   * Route webhook events to appropriate handlers
   */
  handleWebhook(event: ClerkWebhookEvent): void {
    this.logger.log({
      message: 'Processing webhook event',
      eventType: event.type,
    });

    switch (event.type) {
      case 'user.created':
        this.handleUserCreated(event);
        break;
      case 'user.updated':
        this.handleUserUpdated(event);
        break;
      case 'user.deleted':
        this.handleUserDeleted(event);
        break;
      case 'session.created':
        this.handleSessionCreated(event);
        break;
      default:
        this.logger.warn({
          message: 'Unknown webhook event type',
          eventType: (event as ClerkWebhookEvent).type,
        });
    }
  }

  /**
   * Handle user.created webhook
   */
  private handleUserCreated(event: UserCreatedEvent): void {
    try {
      const clerkId = event.data.id;

      this.logger.log({
        message: 'Received user.created webhook',
        clerkId,
      });

      // Trigger Temporal workflow with Clerk user data
      // The workflow will handle database creation
      this.startWorkflowAsync(
        userCreatedWorkflow,
        [event.data],
        `user-created-${clerkId}-${Date.now()}`,
      );

      this.logger.log({
        message: 'User creation workflow triggered',
        clerkId,
      });
    } catch (error) {
      this.logger.error({
        message: 'Error triggering user creation workflow',
        error: error instanceof Error ? error.message : 'Unknown error',
        clerkId: event.data.id,
      });
      throw error;
    }
  }

  /**
   * Handle user.updated webhook
   */
  private handleUserUpdated(event: UserUpdatedEvent): void {
    try {
      const data = event.data;
      const clerkId = data.id;

      // Find primary email
      const primaryEmail =
        data.email_addresses.find(
          (email) => email.id === data.primary_email_address_id,
        )?.email_address || null;

      // Extract mood from unsafe metadata
      const mood = data.unsafe_metadata?.mood as string | undefined;

      this.logger.log({
        message: 'Received user.updated webhook',
        clerkId,
      });

      // Trigger Temporal workflow with update data
      // The workflow will handle database update
      this.startWorkflowAsync(
        userUpdatedWorkflow,
        [
          {
            clerkId,
            updates: {
              firstName: data.first_name,
              lastName: data.last_name,
              email: primaryEmail,
              profileImageUrl: data.profile_image_url,
              username: data.username,
              birthday: data.birthday || undefined,
              lastActiveAt: data.last_active_at,
              mood,
            },
          },
        ],
        `user-updated-${clerkId}-${Date.now()}`,
      );

      this.logger.log({
        message: 'User update workflow triggered',
        clerkId,
      });
    } catch (error) {
      this.logger.error({
        message: 'Error triggering user update workflow',
        error: error instanceof Error ? error.message : 'Unknown error',
        clerkId: event.data.id,
      });
      throw error;
    }
  }

  /**
   * Handle user.deleted webhook
   */
  private handleUserDeleted(event: UserDeletedEvent): void {
    try {
      const clerkId = event.data.id;

      this.logger.log({
        message: 'Received user.deleted webhook',
        clerkId,
      });

      // Trigger Temporal workflow with clerkId
      // The workflow will handle database deletion
      this.startWorkflowAsync(
        userDeletedWorkflow,
        [clerkId],
        `user-deleted-${clerkId}-${Date.now()}`,
      );

      this.logger.log({
        message: 'User deletion workflow triggered',
        clerkId,
      });
    } catch (error) {
      this.logger.error({
        message: 'Error triggering user deletion workflow',
        error: error instanceof Error ? error.message : 'Unknown error',
        clerkId: event.data.id,
      });
      throw error;
    }
  }

  /**
   * Handle session.created webhook
   */
  private handleSessionCreated(event: SessionCreatedEvent): void {
    try {
      const { user_id: clerkId, last_active_at: lastActiveAt } = event.data;

      this.logger.log({
        message: 'Received session.created webhook',
        clerkId,
      });

      // Trigger Temporal workflow with session data
      // The workflow will handle database update
      this.startWorkflowAsync(
        sessionCreatedWorkflow,
        [
          {
            clerkId,
            lastActiveAt,
          },
        ],
        `session-created-${clerkId}-${Date.now()}`,
      );

      this.logger.log({
        message: 'Session created workflow triggered',
        clerkId,
      });
    } catch (error) {
      this.logger.error({
        message: 'Error triggering session created workflow',
        error: error instanceof Error ? error.message : 'Unknown error',
        clerkId: event.data.user_id,
      });
      throw error;
    }
  }

  /**
   * Start a Temporal workflow asynchronously without awaiting
   */
  private startWorkflowAsync<T extends unknown[]>(
    workflow: (...args: T) => Promise<unknown>,
    args: T,
    workflowId: string,
  ): void {
    // Fire and forget - don't await
    this.temporalService
      .getClient()
      .then((client) => {
        return client.workflow.start(workflow, {
          args,
          workflowId,
          taskQueue: 'actually-core-logic',
          workflowExecutionTimeout: '5m',
        });
      })
      .then(() => {
        this.logger.log({
          message: 'Temporal workflow started',
          workflowId,
        });
      })
      .catch((error) => {
        this.logger.error({
          message: 'Failed to start Temporal workflow',
          workflowId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });
  }
}
