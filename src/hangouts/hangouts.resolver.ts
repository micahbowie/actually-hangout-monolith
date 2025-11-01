import {
  Mutation,
  Resolver,
  Args,
  Query,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { Logger, UseGuards, ParseIntPipe } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthObject } from '../auth/types/auth.types';
import { HangoutsService } from './hangouts.service';
import {
  HangoutNotFoundError,
  HangoutUnauthorizedError,
  InvalidPaginationTokenError,
  UserNotFoundError,
} from './errors/hangout.errors';
import { Hangout } from './entities/hangout.entity';
import {
  GroupDecisionSuggestions,
  SuggestionType,
  HangoutAvailabilityType,
} from './entities/suggestion.entity';
import { CreateHangoutInput } from './dto/create-hangout.input';
import { UpdateHangoutInput } from './dto/update-hangout.input';
import { AddCollaboratorInput } from './dto/add-collaborator.input';
import { RemoveCollaboratorInput } from './dto/remove-collaborator.input';
import { InviteUserInput } from './dto/invite-user.input';
import { UninviteUserInput } from './dto/uninvite-user.input';
import { RespondToInvitationInput } from './dto/respond-invitation.input';
import { GetInvitationsInput } from './dto/get-invitations.input';
import { GetHangoutsInput, HangoutsResponse } from './dto/get-hangouts.input';
import { UsersService } from '../users/users.service';
import { HangoutCollaboratorConnection } from './types/hangout-collaborator-connection.types';
import { HangoutCollaborator } from './entities/hangout-collaborator.entity';
import { Invitation } from './entities/invitation.entity';
import { InvitationConnection } from './types/invitation-connection.types';

@Resolver(() => Hangout)
export class HangoutsResolver {
  private readonly logger = new Logger(HangoutsResolver.name);

  constructor(
    private readonly hangoutsService: HangoutsService,
    private readonly usersService: UsersService,
  ) {}

  @Mutation(() => Hangout, {
    name: 'createHangout',
    description: 'Creates a new hangout with optional group decision settings',
  })
  @UseGuards(ClerkAuthGuard)
  async createHangout(
    @CurrentUser() auth: AuthObject,
    @Args('input') input: CreateHangoutInput,
  ): Promise<Hangout> {
    this.logger.log({
      message: 'Creating hangout',
      userId: auth.userId,
      title: input.title,
    });

    try {
      // Get the numeric user ID from clerk ID
      const user = await this.usersService.getUserByClerkId(auth.userId);
      if (!user) {
        this.logger.error({
          message: 'User not found',
          clerkId: auth.userId,
        });
        throw new Error('User not found');
      }

      const hangout = await this.hangoutsService.createHangout(input, user.id);

      this.logger.log({
        message: 'Hangout created successfully',
        userId: auth.userId,
        hangoutId: hangout.id,
        hangoutUuid: hangout.uuid,
      });

      return hangout;
    } catch (error) {
      this.logger.error({
        message: 'Failed to create hangout',
        userId: auth.userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Capture error in Sentry for monitoring
      Sentry.captureException(error, {
        extra: {
          userId: auth.userId,
          title: input.title,
          collaborationMode: input.collaborationMode,
          input: JSON.stringify(input),
        },
      });

      // Return user-friendly error message without leaking implementation details
      if (error instanceof Error) {
        const lowerMessage = error.message.toLowerCase();
        // Only pass through specific validation errors
        if (
          lowerMessage.includes('required') ||
          lowerMessage.includes('invalid') ||
          lowerMessage.includes('must be') ||
          lowerMessage.includes('cannot exceed') ||
          lowerMessage.includes('deadline') ||
          lowerMessage.includes('not found')
        ) {
          throw new Error(error.message);
        }
      }

      // Generic error for all other cases
      throw new Error(
        'Failed to create hangout. Please check your input and try again.',
      );
    }
  }

  @Query(() => Hangout, {
    name: 'hangout',
    description: 'Get a hangout by ID with visibility authorization',
    nullable: true,
  })
  @UseGuards(ClerkAuthGuard)
  async getHangout(
    @CurrentUser() auth: AuthObject,
    @Args('id', ParseIntPipe) id: number,
  ): Promise<Hangout | null> {
    // Get the numeric user ID from clerk ID for authorization
    const user = await this.usersService.getUserByClerkId(auth.userId);
    if (!user) {
      throw new UserNotFoundError('User not found');
    }

    return this.hangoutsService.getHangoutById(id, user.id);
  }

  @ResolveField(() => GroupDecisionSuggestions, { nullable: true })
  async groupDecisionSuggestions(
    @Parent() hangout: Hangout,
  ): Promise<GroupDecisionSuggestions | null> {
    if (!hangout.collaborationMode) {
      return null;
    }

    const suggestions = await this.hangoutsService.getSuggestionsByHangoutId(
      hangout.id,
    );

    // Group suggestions by type and convert to GraphQL types
    const locationSuggestions = suggestions
      .filter((s) => s.suggestionType === SuggestionType.LOCATION)
      .map((s) => ({
        id: s.uuid,
        location: s.locationName || '',
        locationDetails:
          s.locationLatitude && s.locationLongitude
            ? {
                coordinates: {
                  latitude: Number(s.locationLatitude),
                  longitude: Number(s.locationLongitude),
                },
                fullAddress: s.locationAddress || undefined,
                placedFormatted: s.locationName || undefined,
              }
            : undefined,
        note: s.notes || undefined,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        suggestedBy: s.userId.toString(),
      }));

    const activitySuggestions = suggestions
      .filter((s) => s.suggestionType === SuggestionType.ACTIVITY)
      .map((s) => ({
        id: s.uuid,
        activity: s.activityName || '',
        note: s.notes || undefined,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        suggestedBy: s.userId.toString(),
      }));

    const dateTimeSuggestions = suggestions
      .filter((s) => s.suggestionType === SuggestionType.TIME)
      .map((s) => ({
        id: s.uuid,
        dateTime: s.suggestedStartTime?.toISOString() || '',
        availabilityType: HangoutAvailabilityType.SPECIFIC, // Default for now
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        suggestedBy: s.userId.toString(),
      }));

    return {
      locations: locationSuggestions,
      activities: activitySuggestions,
      dateTimes: dateTimeSuggestions,
    };
  }

  @ResolveField(() => HangoutCollaboratorConnection, {
    nullable: true,
    description: 'Get paginated collaborators for this hangout',
  })
  @UseGuards(ClerkAuthGuard)
  async collaborators(
    @Parent() hangout: Hangout,
    @CurrentUser() auth: AuthObject,
    @Args('first', { type: () => Number, nullable: true, defaultValue: 20 })
    first?: number,
    @Args('after', { type: () => String, nullable: true })
    after?: string,
    @Args('last', { type: () => Number, nullable: true })
    last?: number,
    @Args('before', { type: () => String, nullable: true })
    before?: string,
  ): Promise<HangoutCollaboratorConnection | null> {
    this.logger.debug({
      message: 'Fetching collaborators for hangout',
      hangoutId: hangout.id,
      userId: auth.userId,
      first,
      after,
      last,
      before,
    });

    // Get the numeric user ID from clerk ID for authorization
    const user = await this.usersService.getUserByClerkId(auth.userId);
    if (!user) {
      throw new UserNotFoundError('User not found');
    }

    // Authorization check: Verify user has permission to view this hangout's collaborators
    // This verifies the user can access the hangout based on visibility rules
    const authorizedHangout = await this.hangoutsService.getHangoutById(
      hangout.id,
      user.id,
    );

    if (!authorizedHangout) {
      this.logger.warn({
        message: 'Unauthorized access to hangout collaborators',
        hangoutId: hangout.id,
        userId: user.id,
      });
      throw new HangoutUnauthorizedError('Not authorized to view this hangout');
    }

    return this.hangoutsService.getCollaborators(hangout.id, {
      first,
      after,
      last,
      before,
    });
  }

  @Mutation(() => Boolean, {
    name: 'deleteHangout',
    description: 'Delete a hangout (only creator can delete)',
  })
  @UseGuards(ClerkAuthGuard)
  async deleteHangout(
    @CurrentUser() auth: AuthObject,
    @Args('id', ParseIntPipe) id: number,
  ): Promise<boolean> {
    try {
      // Get the numeric user ID from clerk ID
      const user = await this.usersService.getUserByClerkId(auth.userId);
      if (!user) {
        throw new UserNotFoundError('User not found');
      }

      const result = await this.hangoutsService.deleteHangout(id, user.id);

      this.logger.log({
        message: 'Hangout deleted successfully',
        userId: auth.userId,
        hangoutId: id,
      });

      return result;
    } catch (error) {
      // Log error details
      this.logger.error({
        message: 'Failed to delete hangout',
        userId: auth.userId,
        hangoutId: id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Pass through known error types
      if (
        error instanceof UserNotFoundError ||
        error instanceof HangoutNotFoundError ||
        error instanceof HangoutUnauthorizedError
      ) {
        // Capture in Sentry for monitoring
        Sentry.captureException(error, {
          extra: {
            userId: auth.userId,
            hangoutId: id,
          },
        });
        throw error;
      }

      // For unexpected errors, capture in Sentry and return generic message
      Sentry.captureException(error, {
        extra: {
          userId: auth.userId,
          hangoutId: id,
        },
      });
      throw new Error('Failed to delete hangout. Please try again.');
    }
  }

  @Query(() => HangoutsResponse, {
    name: 'hangouts',
    description: 'Get hangouts with filtering and pagination',
  })
  @UseGuards(ClerkAuthGuard)
  async getHangouts(
    @CurrentUser() auth: AuthObject,
    @Args('input', { nullable: true }) input?: GetHangoutsInput,
  ): Promise<HangoutsResponse> {
    try {
      // Get the numeric user ID from clerk ID
      const user = await this.usersService.getUserByClerkId(auth.userId);
      if (!user) {
        throw new UserNotFoundError('User not found');
      }

      const result = await this.hangoutsService.getHangouts(user.id, input);

      this.logger.log({
        message: 'Hangouts retrieved successfully',
        userId: auth.userId,
        count: result.hangouts.length,
        total: result.total,
      });

      return result;
    } catch (error) {
      // Log error details
      this.logger.error({
        message: 'Failed to get hangouts',
        userId: auth.userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Pass through known error types
      if (
        error instanceof UserNotFoundError ||
        error instanceof InvalidPaginationTokenError
      ) {
        // Capture in Sentry for monitoring
        Sentry.captureException(error, {
          extra: {
            userId: auth.userId,
            filters: input,
          },
        });
        throw error;
      }

      // For unexpected errors, capture in Sentry and return generic message
      Sentry.captureException(error, {
        extra: {
          userId: auth.userId,
          filters: input,
        },
      });
      throw new Error('Failed to get hangouts. Please try again.');
    }
  }

  @Mutation(() => Hangout, {
    name: 'updateHangout',
    description: 'Update a hangout (only creator can update)',
  })
  @UseGuards(ClerkAuthGuard)
  async updateHangout(
    @CurrentUser() auth: AuthObject,
    @Args('input') input: UpdateHangoutInput,
  ): Promise<Hangout> {
    this.logger.log({
      message: 'Updating hangout',
      userId: auth.userId,
      hangoutId: input.id,
    });

    try {
      // Get the numeric user ID from clerk ID
      const user = await this.usersService.getUserByClerkId(auth.userId);
      if (!user) {
        throw new UserNotFoundError('User not found');
      }

      const hangout = await this.hangoutsService.updateHangout(input, user.id);

      this.logger.log({
        message: 'Hangout updated successfully',
        userId: auth.userId,
        hangoutId: hangout.id,
      });

      return hangout;
    } catch (error) {
      this.logger.error({
        message: 'Failed to update hangout',
        userId: auth.userId,
        hangoutId: input.id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Pass through known error types
      if (
        error instanceof UserNotFoundError ||
        error instanceof HangoutNotFoundError ||
        error instanceof HangoutUnauthorizedError
      ) {
        Sentry.captureException(error, {
          extra: {
            userId: auth.userId,
            hangoutId: input.id,
            input: JSON.stringify(input),
          },
        });
        throw error;
      }

      // For validation errors, pass through the message
      if (error instanceof Error) {
        const lowerMessage = error.message.toLowerCase();
        if (
          lowerMessage.includes('required') ||
          lowerMessage.includes('invalid') ||
          lowerMessage.includes('must be') ||
          lowerMessage.includes('cannot exceed') ||
          lowerMessage.includes('deadline') ||
          lowerMessage.includes('not found')
        ) {
          throw new Error(error.message);
        }
      }

      // Capture unexpected errors in Sentry
      Sentry.captureException(error, {
        extra: {
          userId: auth.userId,
          hangoutId: input.id,
          input: JSON.stringify(input),
        },
      });
      throw new Error('Failed to update hangout. Please try again.');
    }
  }

  @Mutation(() => HangoutCollaborator, {
    name: 'addCollaborator',
    description:
      'Add a collaborator to a hangout (only creator can add, hangout must be in collaboration mode)',
  })
  @UseGuards(ClerkAuthGuard)
  async addCollaborator(
    @CurrentUser() auth: AuthObject,
    @Args('input') input: AddCollaboratorInput,
  ): Promise<HangoutCollaborator> {
    this.logger.log({
      message: 'Adding collaborator to hangout',
      userId: auth.userId,
      hangoutId: input.hangoutId,
      collaboratorUserId: input.userId,
    });

    try {
      // Get the numeric user ID from clerk ID
      const user = await this.usersService.getUserByClerkId(auth.userId);
      if (!user) {
        throw new UserNotFoundError('User not found');
      }

      const collaborator = await this.hangoutsService.addCollaborator(
        input,
        user.id,
      );

      this.logger.log({
        message: 'Collaborator added successfully',
        userId: auth.userId,
        hangoutId: input.hangoutId,
        collaboratorId: collaborator.id,
      });

      return collaborator;
    } catch (error) {
      this.logger.error({
        message: 'Failed to add collaborator',
        userId: auth.userId,
        hangoutId: input.hangoutId,
        collaboratorUserId: input.userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Pass through known error types
      if (
        error instanceof UserNotFoundError ||
        error instanceof HangoutNotFoundError ||
        error instanceof HangoutUnauthorizedError
      ) {
        Sentry.captureException(error, {
          extra: {
            userId: auth.userId,
            input: JSON.stringify(input),
          },
        });
        throw error;
      }

      // For validation errors, pass through the message
      if (error instanceof Error) {
        const lowerMessage = error.message.toLowerCase();
        if (
          lowerMessage.includes('already a collaborator') ||
          lowerMessage.includes('not in collaboration mode') ||
          lowerMessage.includes('not found')
        ) {
          throw new Error(error.message);
        }
      }

      // Capture unexpected errors in Sentry
      Sentry.captureException(error, {
        extra: {
          userId: auth.userId,
          input: JSON.stringify(input),
        },
      });
      throw new Error('Failed to add collaborator. Please try again.');
    }
  }

  @Mutation(() => Boolean, {
    name: 'removeCollaborator',
    description:
      'Remove a collaborator from a hangout (only creator can remove)',
  })
  @UseGuards(ClerkAuthGuard)
  async removeCollaborator(
    @CurrentUser() auth: AuthObject,
    @Args('input') input: RemoveCollaboratorInput,
  ): Promise<boolean> {
    this.logger.log({
      message: 'Removing collaborator from hangout',
      userId: auth.userId,
      hangoutId: input.hangoutId,
      collaboratorUserId: input.userId,
    });

    try {
      // Get the numeric user ID from clerk ID
      const user = await this.usersService.getUserByClerkId(auth.userId);
      if (!user) {
        throw new UserNotFoundError('User not found');
      }

      const result = await this.hangoutsService.removeCollaborator(
        input,
        user.id,
      );

      this.logger.log({
        message: 'Collaborator removed successfully',
        userId: auth.userId,
        hangoutId: input.hangoutId,
      });

      return result;
    } catch (error) {
      this.logger.error({
        message: 'Failed to remove collaborator',
        userId: auth.userId,
        hangoutId: input.hangoutId,
        collaboratorUserId: input.userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Pass through known error types
      if (
        error instanceof UserNotFoundError ||
        error instanceof HangoutNotFoundError ||
        error instanceof HangoutUnauthorizedError
      ) {
        Sentry.captureException(error, {
          extra: {
            userId: auth.userId,
            input: JSON.stringify(input),
          },
        });
        throw error;
      }

      // For validation errors, pass through the message
      if (error instanceof Error) {
        const lowerMessage = error.message.toLowerCase();
        if (
          lowerMessage.includes('not a collaborator') ||
          lowerMessage.includes('cannot remove') ||
          lowerMessage.includes('not found')
        ) {
          throw new Error(error.message);
        }
      }

      // Capture unexpected errors in Sentry
      Sentry.captureException(error, {
        extra: {
          userId: auth.userId,
          input: JSON.stringify(input),
        },
      });
      throw new Error('Failed to remove collaborator. Please try again.');
    }
  }

  @Mutation(() => Invitation, {
    name: 'inviteUser',
    description:
      'Invite a user to a hangout (creator or collaborators can invite)',
  })
  @UseGuards(ClerkAuthGuard)
  async inviteUser(
    @CurrentUser() auth: AuthObject,
    @Args('input') input: InviteUserInput,
  ): Promise<Invitation> {
    this.logger.log({
      message: 'Inviting user to hangout',
      userId: auth.userId,
      hangoutId: input.hangoutId,
      inviteeId: input.inviteeId,
    });

    try {
      // Get the numeric user ID from clerk ID
      const user = await this.usersService.getUserByClerkId(auth.userId);
      if (!user) {
        throw new UserNotFoundError('User not found');
      }

      const invitation = await this.hangoutsService.inviteUser(input, user.id);

      this.logger.log({
        message: 'User invited successfully',
        userId: auth.userId,
        hangoutId: input.hangoutId,
        invitationId: invitation.id,
      });

      return invitation;
    } catch (error) {
      this.logger.error({
        message: 'Failed to invite user',
        userId: auth.userId,
        hangoutId: input.hangoutId,
        inviteeId: input.inviteeId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Pass through known error types
      if (
        error instanceof UserNotFoundError ||
        error instanceof HangoutNotFoundError ||
        error instanceof HangoutUnauthorizedError
      ) {
        Sentry.captureException(error, {
          extra: {
            userId: auth.userId,
            input: JSON.stringify(input),
          },
        });
        throw error;
      }

      // For validation errors, pass through the message
      if (error instanceof Error) {
        const lowerMessage = error.message.toLowerCase();
        if (
          lowerMessage.includes('already invited') ||
          lowerMessage.includes('cannot invite') ||
          lowerMessage.includes('not found')
        ) {
          throw new Error(error.message);
        }
      }

      // Capture unexpected errors in Sentry
      Sentry.captureException(error, {
        extra: {
          userId: auth.userId,
          input: JSON.stringify(input),
        },
      });
      throw new Error('Failed to invite user. Please try again.');
    }
  }

  @Mutation(() => Boolean, {
    name: 'uninviteUser',
    description: 'Remove an invitation (creator or inviter can uninvite)',
  })
  @UseGuards(ClerkAuthGuard)
  async uninviteUser(
    @CurrentUser() auth: AuthObject,
    @Args('input') input: UninviteUserInput,
  ): Promise<boolean> {
    this.logger.log({
      message: 'Uninviting user from hangout',
      userId: auth.userId,
      hangoutId: input.hangoutId,
      inviteeId: input.inviteeId,
    });

    try {
      // Get the numeric user ID from clerk ID
      const user = await this.usersService.getUserByClerkId(auth.userId);
      if (!user) {
        throw new UserNotFoundError('User not found');
      }

      const result = await this.hangoutsService.uninviteUser(input, user.id);

      this.logger.log({
        message: 'User uninvited successfully',
        userId: auth.userId,
        hangoutId: input.hangoutId,
      });

      return result;
    } catch (error) {
      this.logger.error({
        message: 'Failed to uninvite user',
        userId: auth.userId,
        hangoutId: input.hangoutId,
        inviteeId: input.inviteeId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Pass through known error types
      if (
        error instanceof UserNotFoundError ||
        error instanceof HangoutNotFoundError ||
        error instanceof HangoutUnauthorizedError
      ) {
        Sentry.captureException(error, {
          extra: {
            userId: auth.userId,
            input: JSON.stringify(input),
          },
        });
        throw error;
      }

      // For validation errors, pass through the message
      if (error instanceof Error) {
        const lowerMessage = error.message.toLowerCase();
        if (
          lowerMessage.includes('not invited') ||
          lowerMessage.includes('not found')
        ) {
          throw new Error(error.message);
        }
      }

      // Capture unexpected errors in Sentry
      Sentry.captureException(error, {
        extra: {
          userId: auth.userId,
          input: JSON.stringify(input),
        },
      });
      throw new Error('Failed to uninvite user. Please try again.');
    }
  }

  @Mutation(() => Invitation, {
    name: 'respondToInvitation',
    description: 'Respond to a hangout invitation (accept, decline, or maybe)',
  })
  @UseGuards(ClerkAuthGuard)
  async respondToInvitation(
    @CurrentUser() auth: AuthObject,
    @Args('input') input: RespondToInvitationInput,
  ): Promise<Invitation> {
    this.logger.log({
      message: 'Responding to invitation',
      userId: auth.userId,
      invitationId: input.invitationId,
      status: input.status,
    });

    try {
      // Get the numeric user ID from clerk ID
      const user = await this.usersService.getUserByClerkId(auth.userId);
      if (!user) {
        throw new UserNotFoundError('User not found');
      }

      const invitation = await this.hangoutsService.respondToInvitation(
        input,
        user.id,
      );

      this.logger.log({
        message: 'Invitation response recorded',
        userId: auth.userId,
        invitationId: input.invitationId,
        status: input.status,
      });

      return invitation;
    } catch (error) {
      this.logger.error({
        message: 'Failed to respond to invitation',
        userId: auth.userId,
        invitationId: input.invitationId,
        status: input.status,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Pass through known error types
      if (
        error instanceof UserNotFoundError ||
        error instanceof HangoutUnauthorizedError
      ) {
        Sentry.captureException(error, {
          extra: {
            userId: auth.userId,
            input: JSON.stringify(input),
          },
        });
        throw error;
      }

      // For validation errors, pass through the message
      if (error instanceof Error) {
        const lowerMessage = error.message.toLowerCase();
        if (
          lowerMessage.includes('not found') ||
          lowerMessage.includes('invalid') ||
          lowerMessage.includes('cannot set')
        ) {
          throw new Error(error.message);
        }
      }

      // Capture unexpected errors in Sentry
      Sentry.captureException(error, {
        extra: {
          userId: auth.userId,
          input: JSON.stringify(input),
        },
      });
      throw new Error('Failed to respond to invitation. Please try again.');
    }
  }

  @Query(() => InvitationConnection, {
    name: 'getInvitations',
    description: 'Get invitations with optional filters and pagination',
  })
  @UseGuards(ClerkAuthGuard)
  async getInvitations(
    @CurrentUser() auth: AuthObject,
    @Args('input', { nullable: true }) input?: GetInvitationsInput,
  ): Promise<InvitationConnection> {
    this.logger.log({
      message: 'Getting invitations',
      userId: auth.userId,
      filters: input ? JSON.stringify(input) : 'none',
    });

    try {
      // Get the numeric user ID from clerk ID
      const user = await this.usersService.getUserByClerkId(auth.userId);
      if (!user) {
        throw new UserNotFoundError('User not found');
      }

      const invitations = await this.hangoutsService.getInvitations(
        input || {},
        user.id,
      );

      this.logger.log({
        message: 'Invitations retrieved',
        userId: auth.userId,
        count: invitations.edges.length,
        totalCount: invitations.totalCount,
      });

      return invitations;
    } catch (error) {
      this.logger.error({
        message: 'Failed to get invitations',
        userId: auth.userId,
        filters: input ? JSON.stringify(input) : 'none',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Pass through known error types
      if (error instanceof UserNotFoundError) {
        Sentry.captureException(error, {
          extra: {
            userId: auth.userId,
            filters: input,
          },
        });
        throw error;
      }

      // Capture unexpected errors in Sentry
      Sentry.captureException(error, {
        extra: {
          userId: auth.userId,
          filters: input,
        },
      });
      throw new Error('Failed to get invitations. Please try again.');
    }
  }
}
