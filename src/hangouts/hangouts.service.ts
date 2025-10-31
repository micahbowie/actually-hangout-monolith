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
import {
  HangoutCollaboratorConnection,
  HangoutCollaboratorEdge,
  PageInfo,
} from './types/hangout-collaborator-connection.types';
import { CreateHangoutInput } from './dto/create-hangout.input';
import {
  HangoutNotFoundError,
  HangoutUnauthorizedError,
  InvalidPaginationTokenError,
} from './errors/hangout.errors';

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

          // Validate deadlines are in the future
          const now = new Date();
          if (suggestionDeadline <= now) {
            this.logger.error({
              message: 'Suggestion deadline must be in the future',
              userId,
              suggestionDeadline: suggestionDeadline.toISOString(),
              now: now.toISOString(),
            });
            throw new Error('Suggestion deadline must be in the future');
          }

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
            throw new Error(
              'Suggestion deadline must be before voting deadline',
            );
          }

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
}
