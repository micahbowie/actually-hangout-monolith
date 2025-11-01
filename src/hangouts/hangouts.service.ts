import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as Sentry from '@sentry/nestjs';
import {
  Hangout,
  HangoutStatus,
  HangoutVisibility,
} from './entities/hangout.entity';
import {
  Suggestion,
  SuggestionType,
  SuggestionStatus,
} from './entities/suggestion.entity';
import { HangoutCollaborator } from './entities/hangout-collaborator.entity';
import { Invitation, InvitationStatus } from './entities/invitation.entity';
import {
  HangoutCollaboratorConnection,
  HangoutCollaboratorEdge,
} from './types/hangout-collaborator-connection.types';
import { PageInfo } from './types/common-connection.types';
import { CreateHangoutInput } from './dto/create-hangout.input';
import { UpdateHangoutInput } from './dto/update-hangout.input';
import { AddCollaboratorInput } from './dto/add-collaborator.input';
import { RemoveCollaboratorInput } from './dto/remove-collaborator.input';
import {
  HangoutNotFoundError,
  HangoutUnauthorizedError,
  InvalidPaginationTokenError,
} from './errors/hangout.errors';
import { CollaboratorRole } from './entities/hangout-collaborator.entity';
import { InviteUserInput } from './dto/invite-user.input';
import { UninviteUserInput } from './dto/uninvite-user.input';
import { RespondToInvitationInput } from './dto/respond-invitation.input';
import { GetInvitationsInput } from './dto/get-invitations.input';
import {
  InvitationConnection,
  InvitationEdge,
} from './types/invitation-connection.types';

@Injectable()
export class HangoutsService {
  private readonly logger = new Logger(HangoutsService.name);
  private readonly DEFAULT_PAGE_SIZE = 20;

  /**
   * Sanitize search input to prevent SQL injection and ILIKE pattern abuse
   * Escapes special SQL LIKE characters: %, _, \
   */
  private sanitizeSearchInput(input: string): string {
    return input
      .replace(/\\/g, '\\\\') // Escape backslashes first
      .replace(/%/g, '\\%') // Escape % wildcard
      .replace(/_/g, '\\_') // Escape _ wildcard
      .trim();
  }

  constructor(
    @InjectRepository(Hangout)
    private readonly hangoutRepository: Repository<Hangout>,
    @InjectRepository(Suggestion)
    private readonly suggestionRepository: Repository<Suggestion>,
    @InjectRepository(HangoutCollaborator)
    private readonly collaboratorRepository: Repository<HangoutCollaborator>,
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
  ) {}

  /**
   * Create a new hangout with optional group decision suggestions
   * This method is transactional to ensure atomicity
   */
  async createHangout(
    data: CreateHangoutInput,
    userId: number,
  ): Promise<Hangout> {
    this.logger.log({
      message: 'Creating hangout',
      userId,
      title: data.title,
      collaborationMode: data.collaborationMode,
    });

    return await this.hangoutRepository.manager.transaction(async (manager) => {
      try {
        const hangoutUuid = uuidv4();

        // Parse date if provided
        let startDateTime: Date | null = null;
        if (data.date) {
          startDateTime = new Date(data.date);
          if (isNaN(startDateTime.getTime())) {
            this.logger.error({
              message: 'Invalid date format',
              userId,
              date: data.date,
            });
            throw new Error('Invalid date format');
          }
        }

        // Create hangout entity
        const hangout = manager.create(Hangout, {
          uuid: hangoutUuid,
          title: data.title,
          description: data.description || null,
          locationName: data.location || null,
          visibility: data.visibility,
          status: HangoutStatus.PENDING,
          collaborationMode: data.collaborationMode,
          startDateTime,
          endDateTime: null,
          userId,
        });

        // Set location details if provided
        if (data.locationDetails) {
          // Store full address without parsing - proper address validation
          // should be done client-side or with a dedicated geocoding service
          if (data.locationDetails.fullAddress) {
            hangout.street1 = data.locationDetails.fullAddress;
          }

          if (data.locationDetails.coordinates) {
            hangout.latitude =
              data.locationDetails.coordinates.latitude || null;
            hangout.longitude =
              data.locationDetails.coordinates.longitude || null;
          }

          if (data.locationDetails.placedFormatted) {
            hangout.locationName = data.locationDetails.placedFormatted;
          }
        }

        // Set group decision settings if collaboration mode is enabled
        if (data.collaborationMode && data.groupDecision) {
          hangout.groupDecisionAnonymousVotingEnabled =
            data.groupDecision.voting.anonymousVotes;
          hangout.groupDecisionAnonymousSuggestionsEnabled =
            data.groupDecision.voting.anonymousSuggestions;
          hangout.groupDecisionVotesPerPerson =
            data.groupDecision.voting.votesPerPerson;
          hangout.groupDecisionSuggestionsPerPerson =
            data.groupDecision.voting.optionsPerPerson;

          // Parse deadlines
          const suggestionDeadline = new Date(
            data.groupDecision.deadlines.suggestion,
          );
          const votingDeadline = new Date(data.groupDecision.deadlines.voting);

          if (
            isNaN(suggestionDeadline.getTime()) ||
            isNaN(votingDeadline.getTime())
          ) {
            this.logger.error({
              message: 'Invalid group decision deadline format',
              userId,
              suggestionDeadline: data.groupDecision.deadlines.suggestion,
              votingDeadline: data.groupDecision.deadlines.voting,
            });
            throw new Error('Invalid deadline format');
          }

          // Validate deadlines using extracted method
          this.validateGroupDecisionDeadlines(
            suggestionDeadline,
            votingDeadline,
            userId,
          );

          hangout.groupDecisionSuggestionDeadline = suggestionDeadline;
          hangout.groupDecisionVotingDeadline = votingDeadline;
        }

        // Save hangout
        const savedHangout = await manager.save(Hangout, hangout);

        this.logger.log({
          message: 'Hangout created',
          userId,
          hangoutId: savedHangout.id,
          hangoutUuid: savedHangout.uuid,
        });

        // Create group decision suggestions if provided
        if (
          data.collaborationMode &&
          data.groupDecisionSuggestions &&
          savedHangout.id
        ) {
          const suggestions: Suggestion[] = [];

          // Create location suggestions
          if (data.groupDecisionSuggestions.locations) {
            for (const loc of data.groupDecisionSuggestions.locations) {
              const suggestion = manager.create(Suggestion, {
                uuid: uuidv4(),
                suggestionType: SuggestionType.LOCATION,
                status: SuggestionStatus.PENDING,
                locationName: loc.location,
                locationAddress: loc.locationDetails?.fullAddress || null,
                locationLatitude:
                  loc.locationDetails?.coordinates?.latitude || null,
                locationLongitude:
                  loc.locationDetails?.coordinates?.longitude || null,
                notes: loc.note || null,
                userId,
                hangoutId: savedHangout.id,
              });
              suggestions.push(suggestion);
            }
          }

          // Create activity suggestions
          if (data.groupDecisionSuggestions.activities) {
            for (const act of data.groupDecisionSuggestions.activities) {
              const suggestion = manager.create(Suggestion, {
                uuid: uuidv4(),
                suggestionType: SuggestionType.ACTIVITY,
                status: SuggestionStatus.PENDING,
                activityName: act.activity,
                notes: act.note || null,
                userId,
                hangoutId: savedHangout.id,
              });
              suggestions.push(suggestion);
            }
          }

          // Create date/time suggestions
          if (data.groupDecisionSuggestions.dateTimes) {
            for (const dt of data.groupDecisionSuggestions.dateTimes) {
              const suggestedDateTime = new Date(dt.dateTime);
              if (isNaN(suggestedDateTime.getTime())) {
                this.logger.error({
                  message: 'Invalid date time suggestion format',
                  userId,
                  dateTime: dt.dateTime,
                });
                throw new Error('Invalid date/time suggestion format');
              }

              const suggestion = manager.create(Suggestion, {
                uuid: uuidv4(),
                suggestionType: SuggestionType.TIME,
                status: SuggestionStatus.PENDING,
                suggestedStartTime: suggestedDateTime,
                suggestedDate: suggestedDateTime,
                notes: null,
                userId,
                hangoutId: savedHangout.id,
              });
              suggestions.push(suggestion);
            }
          }

          // Save all suggestions
          if (suggestions.length > 0) {
            await manager.save(Suggestion, suggestions);

            this.logger.log({
              message: 'Group decision suggestions created',
              userId,
              hangoutId: savedHangout.id,
              suggestionCount: suggestions.length,
            });
          }
        }

        return savedHangout;
      } catch (error) {
        this.logger.error({
          message: 'Error creating hangout',
          userId,
          error: error instanceof Error ? error.message : String(error),
        });

        // Capture error in Sentry for monitoring
        Sentry.captureException(error, {
          extra: {
            userId,
            title: data.title,
            collaborationMode: data.collaborationMode,
          },
        });

        throw error;
      }
    });
  }

  /**
   * Find a hangout by ID with visibility authorization
   * Only returns the hangout if the user is authorized to view it based on visibility settings
   */
  async getHangoutById(id: number, userId?: number): Promise<Hangout | null> {
    const hangout = await this.hangoutRepository.findOne({
      where: { id },
    });

    if (!hangout) {
      return null;
    }

    // If no userId provided, only return public hangouts
    if (!userId) {
      return hangout.visibility === HangoutVisibility.PUBLIC ? hangout : null;
    }

    // Owner can always see their own hangout
    if (hangout.userId === userId) {
      return hangout;
    }

    // For non-owners, check visibility
    // PUBLIC: anyone can see
    // PRIVATE: only owner can see (already checked above)
    // FRIENDS: would need friendship check (not implemented yet, so deny for now)
    if (hangout.visibility === HangoutVisibility.PUBLIC) {
      return hangout;
    }

    // TODO: Add friendship check for FRIENDS visibility
    // For now, deny access to private and friends-only hangouts
    return null;
  }

  /**
   * Find a hangout by UUID
   */
  async getHangoutByUuid(uuid: string): Promise<Hangout | null> {
    return this.hangoutRepository.findOne({
      where: { uuid },
    });
  }

  /**
   * Get suggestions for a hangout
   */
  async getSuggestionsByHangoutId(hangoutId: number): Promise<Suggestion[]> {
    return this.suggestionRepository.find({
      where: { hangoutId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Delete a hangout
   * Only the creator can delete a hangout
   */
  async deleteHangout(id: number, userId: number): Promise<boolean> {
    this.logger.debug({
      message: 'Deleting hangout',
      hangoutId: id,
      userId,
    });

    // Find the hangout and verify ownership
    const hangout = await this.hangoutRepository.findOne({
      where: { id },
    });

    if (!hangout) {
      throw new HangoutNotFoundError('Hangout not found');
    }

    // Verify user is the creator
    if (hangout.userId !== userId) {
      throw new HangoutUnauthorizedError(
        'Not authorized to delete this hangout',
      );
    }

    // Delete the hangout (cascade configuration handles related suggestions)
    await this.hangoutRepository.delete({ id });

    this.logger.log({
      message: 'Hangout deleted successfully',
      hangoutId: id,
      userId,
    });

    return true;
  }

  /**
   * Get hangouts with optional filtering and pagination
   * Returns hangouts the user has access to based on visibility:
   * - User's own hangouts (all visibility levels)
   * - Public hangouts from other users
   * - Friends-only hangouts (TODO: requires friendship implementation)
   *
   * Note: The count query executes before pagination, which may impact
   * performance with large datasets. Consider making total optional or
   * using cursor-based pagination for better performance at scale.
   */
  async getHangouts(
    userId: number,
    filters: {
      search?: string;
      startDate?: string;
      endDate?: string;
      collaborationMode?: boolean;
      status?: HangoutStatus;
      limit?: number;
      nextToken?: string;
    } = {},
  ): Promise<{ hangouts: Hangout[]; nextToken?: string; total: number }> {
    this.logger.debug({
      message: 'Getting hangouts',
      userId,
      filters,
    });

    const limit = filters.limit ?? this.DEFAULT_PAGE_SIZE;
    const offset = filters.nextToken ? parseInt(filters.nextToken, 10) : 0;

    // Validate nextToken after parsing
    if (filters.nextToken && isNaN(offset)) {
      throw new InvalidPaginationTokenError('Invalid pagination token');
    }

    // Build query with visibility-based authorization
    // Users can see:
    // 1. Their own hangouts (any visibility)
    // 2. Public hangouts from others
    // 3. TODO: Friends-only hangouts where they are friends with the creator
    const queryBuilder = this.hangoutRepository
      .createQueryBuilder('hangout')
      .where(
        '(hangout.user_id = :userId OR hangout.visibility = :publicVisibility)',
        { userId, publicVisibility: HangoutVisibility.PUBLIC },
      )
      .orderBy('hangout.created_at', 'DESC');

    // Apply search filter with sanitization
    if (filters.search) {
      const sanitizedSearch = this.sanitizeSearchInput(filters.search);
      queryBuilder.andWhere(
        '(hangout.title ILIKE :search OR hangout.description ILIKE :search OR hangout.location_name ILIKE :search)',
        { search: `%${sanitizedSearch}%` },
      );
    }

    // Apply date filters
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      if (!isNaN(startDate.getTime())) {
        queryBuilder.andWhere('hangout.start_date_time >= :startDate', {
          startDate,
        });
      }
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      if (!isNaN(endDate.getTime())) {
        queryBuilder.andWhere('hangout.start_date_time <= :endDate', {
          endDate,
        });
      }
    }

    // Apply collaboration mode filter
    if (filters.collaborationMode !== undefined) {
      queryBuilder.andWhere('hangout.collaboration_mode = :collaborationMode', {
        collaborationMode: filters.collaborationMode,
      });
    }

    // Apply status filter
    if (filters.status) {
      queryBuilder.andWhere('hangout.status = :status', {
        status: filters.status,
      });
    }

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(offset).take(limit);

    // Execute query
    const hangouts = await queryBuilder.getMany();

    // Calculate next token
    const nextToken =
      hangouts.length === limit ? String(offset + limit) : undefined;

    this.logger.log({
      message: 'Hangouts retrieved successfully',
      userId,
      count: hangouts.length,
      total,
      nextToken,
      filters,
    });

    return {
      hangouts,
      nextToken,
      total,
    };
  }

  /**
   * Get paginated collaborators for a hangout using cursor-based pagination
   * Implements the GraphQL Connection specification
   */
  async getCollaborators(
    hangoutId: number,
    pagination: {
      first?: number;
      after?: string;
      last?: number;
      before?: string;
    },
  ): Promise<HangoutCollaboratorConnection> {
    this.logger.debug({
      message: 'Getting collaborators for hangout',
      hangoutId,
      pagination,
    });

    const { first, after, last, before } = pagination;

    // Validate pagination parameters
    if (first && last) {
      throw new Error('Cannot use both first and last parameters');
    }

    if (first && first < 0) {
      throw new Error('first parameter must be non-negative');
    }

    if (last && last < 0) {
      throw new Error('last parameter must be non-negative');
    }

    // Default page size
    const pageSize = first || last || 20;

    // Decode cursors to get the createdAt timestamps
    let afterDate: Date | null = null;
    let beforeDate: Date | null = null;

    if (after) {
      try {
        const decodedAfter = Buffer.from(after, 'base64').toString('utf-8');
        afterDate = new Date(decodedAfter);
        if (isNaN(afterDate.getTime())) {
          throw new Error('Invalid date');
        }
      } catch {
        throw new Error('Invalid after cursor');
      }
    }

    if (before) {
      try {
        const decodedBefore = Buffer.from(before, 'base64').toString('utf-8');
        beforeDate = new Date(decodedBefore);
        if (isNaN(beforeDate.getTime())) {
          throw new Error('Invalid date');
        }
      } catch {
        throw new Error('Invalid before cursor');
      }
    }

    // Build query
    const queryBuilder = this.collaboratorRepository
      .createQueryBuilder('collaborator')
      .where('collaborator.hangout_id = :hangoutId', { hangoutId })
      .leftJoinAndSelect('collaborator.user', 'user');

    // Apply cursor filtering
    if (afterDate) {
      queryBuilder.andWhere('collaborator.created_at > :afterDate', {
        afterDate,
      });
    }

    if (beforeDate) {
      queryBuilder.andWhere('collaborator.created_at < :beforeDate', {
        beforeDate,
      });
    }

    // Determine sort order based on pagination direction
    if (last) {
      // For backward pagination, sort descending
      queryBuilder.orderBy('collaborator.created_at', 'DESC');
    } else {
      // For forward pagination, sort ascending
      queryBuilder.orderBy('collaborator.created_at', 'ASC');
    }

    // Fetch one more than requested to determine if there are more pages
    queryBuilder.take(pageSize + 1);

    // Execute query
    let collaborators = await queryBuilder.getMany();

    // Check if there are more results
    const hasMore = collaborators.length > pageSize;

    // Remove the extra item if we have more results
    if (hasMore) {
      collaborators = collaborators.slice(0, pageSize);
    }

    // If using backward pagination, reverse the results to maintain correct order
    if (last) {
      collaborators.reverse();
    }

    // Get total count
    const totalCount = await this.collaboratorRepository.count({
      where: { hangoutId },
    });

    // Build edges with cursors
    const edges: HangoutCollaboratorEdge[] = collaborators.map(
      (collaborator) => ({
        node: collaborator,
        cursor: Buffer.from(collaborator.createdAt.toISOString()).toString(
          'base64',
        ),
      }),
    );

    // Build PageInfo
    const pageInfo: PageInfo = {
      hasNextPage: last ? false : hasMore,
      hasPreviousPage: first ? false : hasMore,
      startCursor: edges.length > 0 ? edges[0].cursor : null,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
    };

    // For backward pagination, hasNextPage should be based on whether we're not at the beginning
    if (last) {
      pageInfo.hasNextPage = afterDate !== null || beforeDate !== null;
      pageInfo.hasPreviousPage = hasMore;
    }

    this.logger.log({
      message: 'Collaborators retrieved successfully',
      hangoutId,
      count: edges.length,
      totalCount,
      hasNextPage: pageInfo.hasNextPage,
      hasPreviousPage: pageInfo.hasPreviousPage,
    });

    return {
      edges,
      pageInfo,
      totalCount,
    };
  }

  /**
   * Update a hangout
   * Only the creator can update a hangout
   */
  async updateHangout(
    data: UpdateHangoutInput,
    userId: number,
  ): Promise<Hangout> {
    this.logger.log({
      message: 'Updating hangout',
      userId,
      hangoutId: data.id,
    });

    return await this.hangoutRepository.manager.transaction(async (manager) => {
      // Find the hangout and verify ownership
      const hangout = await manager.findOne(Hangout, {
        where: { id: data.id },
      });

      if (!hangout) {
        this.logger.error({
          message: 'Hangout not found',
          hangoutId: data.id,
          userId,
        });
        throw new HangoutNotFoundError('Hangout not found');
      }

      // Verify user is the creator
      if (hangout.userId !== userId) {
        this.logger.error({
          message: 'User not authorized to update hangout',
          hangoutId: data.id,
          userId,
          creatorId: hangout.userId,
        });
        throw new HangoutUnauthorizedError(
          'Not authorized to update this hangout',
        );
      }

      // Update basic fields
      if (data.title !== undefined) {
        hangout.title = data.title;
      }

      if (data.description !== undefined) {
        hangout.description = data.description;
      }

      if (data.location !== undefined) {
        hangout.locationName = data.location;
      }

      if (data.visibility !== undefined) {
        hangout.visibility = data.visibility;
      }

      if (data.status !== undefined) {
        hangout.status = data.status;
      }

      if (data.collaborationMode !== undefined) {
        hangout.collaborationMode = data.collaborationMode;
      }

      // Update date if provided
      if (data.date !== undefined) {
        if (data.date === null || data.date === '') {
          hangout.startDateTime = null;
        } else {
          const startDateTime = new Date(data.date);
          if (isNaN(startDateTime.getTime())) {
            this.logger.error({
              message: 'Invalid date format',
              userId,
              date: data.date,
            });
            throw new Error('Invalid date format');
          }
          hangout.startDateTime = startDateTime;
        }
      }

      // Update location details if provided
      if (data.locationDetails !== undefined) {
        if (data.locationDetails === null) {
          // Clear location details
          hangout.street1 = null;
          hangout.street2 = null;
          hangout.city = null;
          hangout.state = null;
          hangout.zipCode = null;
          hangout.country = null;
          hangout.latitude = null;
          hangout.longitude = null;
        } else {
          // Update location details
          if (data.locationDetails.fullAddress !== undefined) {
            hangout.street1 = data.locationDetails.fullAddress;
          }

          if (data.locationDetails.coordinates !== undefined) {
            hangout.latitude =
              data.locationDetails.coordinates?.latitude || null;
            hangout.longitude =
              data.locationDetails.coordinates?.longitude || null;
          }

          if (data.locationDetails.placedFormatted !== undefined) {
            hangout.locationName = data.locationDetails.placedFormatted;
          }
        }
      }

      // Update group decision settings if collaboration mode is enabled
      if (data.collaborationMode && data.groupDecision) {
        hangout.groupDecisionAnonymousVotingEnabled =
          data.groupDecision.voting.anonymousVotes;
        hangout.groupDecisionAnonymousSuggestionsEnabled =
          data.groupDecision.voting.anonymousSuggestions;
        hangout.groupDecisionVotesPerPerson =
          data.groupDecision.voting.votesPerPerson;
        hangout.groupDecisionSuggestionsPerPerson =
          data.groupDecision.voting.optionsPerPerson;

        // Parse and validate deadlines
        const suggestionDeadline = new Date(
          data.groupDecision.deadlines.suggestion,
        );
        const votingDeadline = new Date(data.groupDecision.deadlines.voting);

        if (
          isNaN(suggestionDeadline.getTime()) ||
          isNaN(votingDeadline.getTime())
        ) {
          this.logger.error({
            message: 'Invalid group decision deadline format',
            userId,
            suggestionDeadline: data.groupDecision.deadlines.suggestion,
            votingDeadline: data.groupDecision.deadlines.voting,
          });
          throw new Error('Invalid deadline format');
        }

        // Validate deadlines using extracted method
        this.validateGroupDecisionDeadlines(
          suggestionDeadline,
          votingDeadline,
          userId,
        );

        hangout.groupDecisionSuggestionDeadline = suggestionDeadline;
        hangout.groupDecisionVotingDeadline = votingDeadline;
      }

      // Save updated hangout
      const updatedHangout = await manager.save(Hangout, hangout);

      this.logger.log({
        message: 'Hangout updated successfully',
        userId,
        hangoutId: updatedHangout.id,
      });

      return updatedHangout;
    });
  }

  /**
   * Add a collaborator to a hangout
   * Only the creator can add collaborators
   * Hangout must be in collaboration mode
   */
  async addCollaborator(
    data: AddCollaboratorInput,
    requestingUserId: number,
  ): Promise<HangoutCollaborator> {
    this.logger.log({
      message: 'Adding collaborator to hangout',
      hangoutId: data.hangoutId,
      userId: data.userId,
      requestingUserId,
      role: data.role,
    });

    return await this.collaboratorRepository.manager.transaction(
      async (manager) => {
        // Find the hangout and verify ownership
        const hangout = await manager.findOne(Hangout, {
          where: { id: data.hangoutId },
        });

        if (!hangout) {
          this.logger.error({
            message: 'Hangout not found',
            hangoutId: data.hangoutId,
            requestingUserId,
          });
          throw new HangoutNotFoundError('Hangout not found');
        }

        // Verify user is the creator
        if (hangout.userId !== requestingUserId) {
          this.logger.error({
            message: 'User not authorized to add collaborators',
            hangoutId: data.hangoutId,
            requestingUserId,
            creatorId: hangout.userId,
          });
          throw new HangoutUnauthorizedError(
            'Not authorized to add collaborators to this hangout',
          );
        }

        // Verify hangout is in collaboration mode
        if (!hangout.collaborationMode) {
          this.logger.error({
            message: 'Hangout is not in collaboration mode',
            hangoutId: data.hangoutId,
            requestingUserId,
          });
          throw new Error(
            'Cannot add collaborators to a hangout not in collaboration mode',
          );
        }

        // Check if user is already a collaborator
        const existingCollaborator = await manager.findOne(
          HangoutCollaborator,
          {
            where: {
              hangoutId: data.hangoutId,
              userId: data.userId,
            },
          },
        );

        if (existingCollaborator) {
          this.logger.warn({
            message: 'User is already a collaborator',
            hangoutId: data.hangoutId,
            userId: data.userId,
            requestingUserId,
          });
          throw new Error('User is already a collaborator on this hangout');
        }

        // Create collaborator
        const collaborator = manager.create(HangoutCollaborator, {
          uuid: uuidv4(),
          hangoutId: data.hangoutId,
          userId: data.userId,
          role: data.role || CollaboratorRole.COLLABORATOR,
          invitedBy: requestingUserId,
        });

        const savedCollaborator = await manager.save(
          HangoutCollaborator,
          collaborator,
        );

        this.logger.log({
          message: 'Collaborator added successfully',
          hangoutId: data.hangoutId,
          userId: data.userId,
          requestingUserId,
          collaboratorId: savedCollaborator.id,
        });

        return savedCollaborator;
      },
    );
  }

  /**
   * Remove a collaborator from a hangout
   * Only the creator can remove collaborators
   * Cannot remove the organizer (creator)
   */
  async removeCollaborator(
    data: RemoveCollaboratorInput,
    requestingUserId: number,
  ): Promise<boolean> {
    this.logger.log({
      message: 'Removing collaborator from hangout',
      hangoutId: data.hangoutId,
      userId: data.userId,
      requestingUserId,
    });

    return await this.collaboratorRepository.manager.transaction(
      async (manager) => {
        // Find the hangout and verify ownership
        const hangout = await manager.findOne(Hangout, {
          where: { id: data.hangoutId },
        });

        if (!hangout) {
          this.logger.error({
            message: 'Hangout not found',
            hangoutId: data.hangoutId,
            requestingUserId,
          });
          throw new HangoutNotFoundError('Hangout not found');
        }

        // Verify user is the creator
        if (hangout.userId !== requestingUserId) {
          this.logger.error({
            message: 'User not authorized to remove collaborators',
            hangoutId: data.hangoutId,
            requestingUserId,
            creatorId: hangout.userId,
          });
          throw new HangoutUnauthorizedError(
            'Not authorized to remove collaborators from this hangout',
          );
        }

        // Find the collaborator
        const collaborator = await manager.findOne(HangoutCollaborator, {
          where: {
            hangoutId: data.hangoutId,
            userId: data.userId,
          },
        });

        if (!collaborator) {
          this.logger.warn({
            message: 'Collaborator not found',
            hangoutId: data.hangoutId,
            userId: data.userId,
            requestingUserId,
          });
          throw new Error('User is not a collaborator on this hangout');
        }

        // Cannot remove the organizer
        if (collaborator.role === CollaboratorRole.ORGANIZER) {
          this.logger.error({
            message: 'Cannot remove organizer',
            hangoutId: data.hangoutId,
            userId: data.userId,
            requestingUserId,
          });
          throw new Error('Cannot remove the organizer from the hangout');
        }

        // Delete the collaborator
        await manager.delete(HangoutCollaborator, {
          id: collaborator.id,
        });

        this.logger.log({
          message: 'Collaborator removed successfully',
          hangoutId: data.hangoutId,
          userId: data.userId,
          requestingUserId,
        });

        return true;
      },
    );
  }

  /**
   * Invite a user to a hangout
   * Only the creator or collaborators can invite users
   */
  async inviteUser(
    data: InviteUserInput,
    requestingUserId: number,
  ): Promise<Invitation> {
    this.logger.log({
      message: 'Inviting user to hangout',
      hangoutId: data.hangoutId,
      inviteeId: data.inviteeId,
      requestingUserId,
    });

    return await this.invitationRepository.manager.transaction(
      async (manager) => {
        // Find the hangout
        const hangout = await manager.findOne(Hangout, {
          where: { id: data.hangoutId },
        });

        if (!hangout) {
          this.logger.error({
            message: 'Hangout not found',
            hangoutId: data.hangoutId,
            requestingUserId,
          });
          throw new HangoutNotFoundError('Hangout not found');
        }

        // Check if requesting user is the creator
        const isCreator = hangout.userId === requestingUserId;

        // Check if requesting user is a collaborator
        let isCollaborator = false;
        if (!isCreator && hangout.collaborationMode) {
          const collaborator = await manager.findOne(HangoutCollaborator, {
            where: {
              hangoutId: data.hangoutId,
              userId: requestingUserId,
            },
          });
          isCollaborator = !!collaborator;
        }

        // Verify user has permission to invite
        if (!isCreator && !isCollaborator) {
          this.logger.error({
            message: 'User not authorized to invite to this hangout',
            hangoutId: data.hangoutId,
            requestingUserId,
            creatorId: hangout.userId,
          });
          throw new HangoutUnauthorizedError(
            'Not authorized to invite users to this hangout',
          );
        }

        // Check if user is already invited
        const existingInvitation = await manager.findOne(Invitation, {
          where: {
            hangoutId: data.hangoutId,
            inviteeId: data.inviteeId,
          },
        });

        if (existingInvitation) {
          this.logger.warn({
            message: 'User is already invited',
            hangoutId: data.hangoutId,
            inviteeId: data.inviteeId,
            requestingUserId,
            existingStatus: existingInvitation.status,
          });
          throw new Error('User is already invited to this hangout');
        }

        // Cannot invite yourself
        if (data.inviteeId === requestingUserId) {
          this.logger.error({
            message: 'Cannot invite yourself',
            hangoutId: data.hangoutId,
            requestingUserId,
          });
          throw new Error('Cannot invite yourself to a hangout');
        }

        // Create invitation
        const invitation = manager.create(Invitation, {
          uuid: uuidv4(),
          hangoutId: data.hangoutId,
          inviteeId: data.inviteeId,
          inviterId: requestingUserId,
          message: data.message,
          status: InvitationStatus.PENDING,
        });

        const savedInvitation = await manager.save(Invitation, invitation);

        this.logger.log({
          message: 'User invited successfully',
          hangoutId: data.hangoutId,
          inviteeId: data.inviteeId,
          requestingUserId,
          invitationId: savedInvitation.id,
        });

        return savedInvitation;
      },
    );
  }

  /**
   * Remove an invitation (uninvite a user)
   * Only the creator or the person who sent the invitation can remove it
   */
  async uninviteUser(
    data: UninviteUserInput,
    requestingUserId: number,
  ): Promise<boolean> {
    this.logger.log({
      message: 'Uninviting user from hangout',
      hangoutId: data.hangoutId,
      inviteeId: data.inviteeId,
      requestingUserId,
    });

    return await this.invitationRepository.manager.transaction(
      async (manager) => {
        // Find the hangout
        const hangout = await manager.findOne(Hangout, {
          where: { id: data.hangoutId },
        });

        if (!hangout) {
          this.logger.error({
            message: 'Hangout not found',
            hangoutId: data.hangoutId,
            requestingUserId,
          });
          throw new HangoutNotFoundError('Hangout not found');
        }

        // Find the invitation
        const invitation = await manager.findOne(Invitation, {
          where: {
            hangoutId: data.hangoutId,
            inviteeId: data.inviteeId,
          },
        });

        if (!invitation) {
          this.logger.warn({
            message: 'Invitation not found',
            hangoutId: data.hangoutId,
            inviteeId: data.inviteeId,
            requestingUserId,
          });
          throw new Error('User is not invited to this hangout');
        }

        // Check if requesting user is the creator or the inviter
        const isCreator = hangout.userId === requestingUserId;
        const isInviter = invitation.inviterId === requestingUserId;

        if (!isCreator && !isInviter) {
          this.logger.error({
            message: 'User not authorized to remove invitation',
            hangoutId: data.hangoutId,
            inviteeId: data.inviteeId,
            requestingUserId,
            creatorId: hangout.userId,
            inviterId: invitation.inviterId,
          });
          throw new HangoutUnauthorizedError(
            'Not authorized to remove this invitation',
          );
        }

        // Delete the invitation
        await manager.delete(Invitation, {
          id: invitation.id,
        });

        this.logger.log({
          message: 'Invitation removed successfully',
          hangoutId: data.hangoutId,
          inviteeId: data.inviteeId,
          requestingUserId,
        });

        return true;
      },
    );
  }

  /**
   * Respond to an invitation
   * Only the invitee can respond
   */
  /**
   * Respond to a hangout invitation
   *
   * INVITATION → COLLABORATOR FLOW:
   * --------------------------------
   * This method only records the user's response to an invitation.
   * It does NOT automatically create a collaborator record.
   *
   * The invitation-to-collaborator conversion happens in two scenarios:
   * 1. Manual: Hangout creator uses addCollaborator() to explicitly add the user
   * 2. Automatic (Future): When the user RSVPs or checks in to the hangout
   *
   * CURRENT STATE:
   * - Invitations track who was invited and their response (accepted/declined/maybe)
   * - Collaborators track who is actively participating in hangout planning
   * - These are separate concerns and don't automatically sync
   *
   * FUTURE ENHANCEMENT:
   * - Add a workflow that automatically creates a collaborator when:
   *   a) Invitation is accepted AND
   *   b) Hangout is in collaboration mode AND
   *   c) User confirms participation
   *
   * @param data - The invitation ID and new status
   * @param requestingUserId - The ID of the user responding (must be the invitee)
   * @returns The updated invitation
   * @throws HangoutUnauthorizedError if user is not the invitee
   * @throws Error if invitation not found or invalid status
   */
  async respondToInvitation(
    data: RespondToInvitationInput,
    requestingUserId: number,
  ): Promise<Invitation> {
    this.logger.log({
      message: 'Responding to invitation',
      invitationId: data.invitationId,
      status: data.status,
      requestingUserId,
    });

    return await this.invitationRepository.manager.transaction(
      async (manager) => {
        // Find the invitation
        const invitation = await manager.findOne(Invitation, {
          where: { id: data.invitationId },
          relations: ['hangout'],
        });

        if (!invitation) {
          this.logger.error({
            message: 'Invitation not found',
            invitationId: data.invitationId,
            requestingUserId,
          });
          throw new Error('Invitation not found');
        }

        // Verify user is the invitee
        if (invitation.inviteeId !== requestingUserId) {
          this.logger.error({
            message: 'User not authorized to respond to invitation',
            invitationId: data.invitationId,
            requestingUserId,
            inviteeId: invitation.inviteeId,
          });
          throw new HangoutUnauthorizedError(
            'Not authorized to respond to this invitation',
          );
        }

        // Cannot respond with pending status
        if (data.status === InvitationStatus.PENDING) {
          this.logger.error({
            message: 'Invalid invitation status',
            invitationId: data.invitationId,
            status: data.status,
            requestingUserId,
          });
          throw new Error('Cannot set invitation status to pending');
        }

        // Update invitation
        invitation.status = data.status;
        invitation.respondedAt = new Date();

        const updatedInvitation = await manager.save(Invitation, invitation);

        this.logger.log({
          message: 'Invitation response recorded',
          invitationId: data.invitationId,
          status: data.status,
          requestingUserId,
          hangoutId: invitation.hangoutId,
          collaborationMode: invitation.hangout?.collaborationMode,
          note: 'Invitation accepted but collaborator NOT auto-created. See INVITATION → COLLABORATOR FLOW comment above.',
        });

        // TODO: Future enhancement - Trigger Temporal workflow for:
        // 1. Sending notification to hangout creator about response
        // 2. Auto-creating collaborator if accepted + collaboration mode
        // 3. Suggesting times if hangout has no confirmed time

        return updatedInvitation;
      },
    );
  }

  /**
   * Get invitations with pagination and authorization
   * Users can only see invitations where they are:
   * - The invitee (they were invited)
   * - The inviter (they sent the invitation)
   * - The hangout creator (they can see all invitations to their hangout)
   */
  async getInvitations(
    filters: GetInvitationsInput,
    requestingUserId: number,
  ): Promise<InvitationConnection> {
    this.logger.log({
      message: 'Getting invitations',
      filters: JSON.stringify(filters),
      requestingUserId,
    });

    // Validate pagination parameters
    const pageSize = Math.min(filters.first || 20, 100);

    // Decode cursor if provided
    let afterDate: Date | undefined;
    if (filters.after) {
      try {
        const decodedCursor = Buffer.from(filters.after, 'base64').toString(
          'utf-8',
        );
        afterDate = new Date(decodedCursor);
        if (isNaN(afterDate.getTime())) {
          throw new InvalidPaginationTokenError('Invalid after cursor');
        }
      } catch {
        throw new InvalidPaginationTokenError('Invalid after cursor');
      }
    }

    // Build query with authorization
    // Users can see invitations where they are the invitee, inviter, or hangout creator
    const queryBuilder = this.invitationRepository
      .createQueryBuilder('invitation')
      .leftJoinAndSelect('invitation.invitee', 'invitee')
      .leftJoinAndSelect('invitation.inviter', 'inviter')
      .leftJoinAndSelect('invitation.hangout', 'hangout')
      .where(
        '(invitation.invitee_id = :requestingUserId OR invitation.inviter_id = :requestingUserId OR hangout.user_id = :requestingUserId)',
        { requestingUserId },
      );

    // Apply filters
    if (filters.hangoutId) {
      queryBuilder.andWhere('invitation.hangout_id = :hangoutId', {
        hangoutId: filters.hangoutId,
      });
    }

    if (filters.inviteeId) {
      queryBuilder.andWhere('invitation.invitee_id = :inviteeId', {
        inviteeId: filters.inviteeId,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('invitation.status = :status', {
        status: filters.status,
      });
    }

    // Apply cursor pagination
    if (afterDate) {
      queryBuilder.andWhere('invitation.created_at > :afterDate', {
        afterDate,
      });
    }

    // Order and limit
    queryBuilder.orderBy('invitation.created_at', 'ASC').take(pageSize + 1); // Fetch one extra to determine hasNextPage

    const invitations = await queryBuilder.getMany();

    // Get total count with same authorization filter
    const countQuery = this.invitationRepository
      .createQueryBuilder('invitation')
      .leftJoin('invitation.hangout', 'hangout')
      .where(
        '(invitation.invitee_id = :requestingUserId OR invitation.inviter_id = :requestingUserId OR hangout.user_id = :requestingUserId)',
        { requestingUserId },
      );

    if (filters.hangoutId) {
      countQuery.andWhere('invitation.hangout_id = :hangoutId', {
        hangoutId: filters.hangoutId,
      });
    }

    if (filters.inviteeId) {
      countQuery.andWhere('invitation.invitee_id = :inviteeId', {
        inviteeId: filters.inviteeId,
      });
    }

    if (filters.status) {
      countQuery.andWhere('invitation.status = :status', {
        status: filters.status,
      });
    }

    const totalCount = await countQuery.getCount();

    // Determine if there are more results
    const hasNextPage = invitations.length > pageSize;
    if (hasNextPage) {
      invitations.pop(); // Remove the extra item
    }

    // Create edges and cursors
    const edges: InvitationEdge[] = invitations.map((invitation) => ({
      node: invitation,
      cursor: Buffer.from(invitation.createdAt.toISOString()).toString(
        'base64',
      ),
    }));

    // Create page info
    const pageInfo: PageInfo = {
      startCursor: edges.length > 0 ? edges[0].cursor : null,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
      hasNextPage,
      hasPreviousPage: !!afterDate,
    };

    this.logger.log({
      message: 'Invitations retrieved successfully',
      requestingUserId,
      count: edges.length,
      totalCount,
      hasNextPage: pageInfo.hasNextPage,
      hasPreviousPage: pageInfo.hasPreviousPage,
    });

    return {
      edges,
      pageInfo,
      totalCount,
    };
  }

  /**
   * Validate group decision deadlines
   * Ensures both deadlines are in the future and suggestion deadline comes before voting deadline
   *
   * @param suggestionDeadline - The deadline for submitting suggestions
   * @param votingDeadline - The deadline for voting on suggestions
   * @param userId - The ID of the user making the request (for logging)
   * @throws Error if validation fails
   */
  private validateGroupDecisionDeadlines(
    suggestionDeadline: Date,
    votingDeadline: Date,
    userId: number,
  ): void {
    const now = new Date();

    // Validate suggestion deadline is in the future
    if (suggestionDeadline <= now) {
      this.logger.error({
        message: 'Suggestion deadline must be in the future',
        userId,
        suggestionDeadline: suggestionDeadline.toISOString(),
        now: now.toISOString(),
      });
      throw new Error('Suggestion deadline must be in the future');
    }

    // Validate voting deadline is in the future
    if (votingDeadline <= now) {
      this.logger.error({
        message: 'Voting deadline must be in the future',
        userId,
        votingDeadline: votingDeadline.toISOString(),
        now: now.toISOString(),
      });
      throw new Error('Voting deadline must be in the future');
    }

    // Validate suggestion deadline comes before voting deadline
    if (suggestionDeadline >= votingDeadline) {
      this.logger.error({
        message: 'Suggestion deadline must be before voting deadline',
        userId,
        suggestionDeadline: suggestionDeadline.toISOString(),
        votingDeadline: votingDeadline.toISOString(),
      });
      throw new Error('Suggestion deadline must be before voting deadline');
    }
  }
}
