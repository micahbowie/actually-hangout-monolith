import {
  Mutation,
  Resolver,
  Args,
  Query,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { Logger, UseGuards } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthObject } from '../auth/types/auth.types';
import { HangoutsService } from './hangouts.service';
import {
  HangoutNotFoundError,
  HangoutUnauthorizedError,
  InvalidHangoutIdError,
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
import { GetHangoutsInput, HangoutsResponse } from './dto/get-hangouts.input';
import { UsersService } from '../users/users.service';

@Resolver(() => Hangout)
export class HangoutsResolver {
  private readonly logger = new Logger(HangoutsResolver.name);

  constructor(
    private readonly hangoutsService: HangoutsService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Parse and validate a string ID to a number
   * @throws InvalidHangoutIdError if the ID is not a valid number
   */
  private parseHangoutId(id: string): number {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      throw new InvalidHangoutIdError('Invalid hangout ID');
    }
    return numericId;
  }

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
    @Args('id') id: string,
  ): Promise<Hangout | null> {
    const numericId = this.parseHangoutId(id);

    // Get the numeric user ID from clerk ID for authorization
    const user = await this.usersService.getUserByClerkId(auth.userId);
    if (!user) {
      throw new UserNotFoundError('User not found');
    }

    return this.hangoutsService.getHangoutById(numericId, user.id);
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

  @Mutation(() => Boolean, {
    name: 'deleteHangout',
    description: 'Delete a hangout (only creator can delete)',
  })
  @UseGuards(ClerkAuthGuard)
  async deleteHangout(
    @CurrentUser() auth: AuthObject,
    @Args('id') id: string,
  ): Promise<boolean> {
    try {
      // Get the numeric user ID from clerk ID
      const user = await this.usersService.getUserByClerkId(auth.userId);
      if (!user) {
        throw new UserNotFoundError('User not found');
      }

      const numericId = this.parseHangoutId(id);

      const result = await this.hangoutsService.deleteHangout(
        numericId,
        user.id,
      );

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
        error instanceof HangoutUnauthorizedError ||
        error instanceof InvalidHangoutIdError
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
}
