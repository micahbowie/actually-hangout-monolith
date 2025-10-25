import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as Sentry from '@sentry/nestjs';
import { Hangout, HangoutStatus } from './entities/hangout.entity';
import {
  Suggestion,
  SuggestionType,
  SuggestionStatus,
} from './entities/suggestion.entity';
import { CreateHangoutInput } from './dto/create-hangout.input';

@Injectable()
export class HangoutsService {
  private readonly logger = new Logger(HangoutsService.name);

  constructor(
    @InjectRepository(Hangout)
    private readonly hangoutRepository: Repository<Hangout>,
    @InjectRepository(Suggestion)
    private readonly suggestionRepository: Repository<Suggestion>,
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
   * Find a hangout by ID
   */
  async getHangoutById(id: number): Promise<Hangout | null> {
    return this.hangoutRepository.findOne({
      where: { id },
    });
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
}
