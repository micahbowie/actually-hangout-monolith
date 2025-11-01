import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HangoutsService } from './hangouts.service';
import {
  Hangout,
  HangoutVisibility,
  HangoutStatus,
} from './entities/hangout.entity';
import {
  Suggestion,
  SuggestionType,
  HangoutAvailabilityType,
} from './entities/suggestion.entity';
import { HangoutCollaborator } from './entities/hangout-collaborator.entity';
import { Invitation, InvitationStatus } from './entities/invitation.entity';
import { CreateHangoutInput } from './dto/create-hangout.input';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
describe('HangoutsService', () => {
  let service: HangoutsService;
  let hangoutRepository: jest.Mocked<Repository<Hangout>>;
  let invitationRepository: any;
  let mockManager: any;

  const mockUserId = 1;

  const mockHangout: Hangout = {
    id: 1,
    uuid: 'test-uuid-1234',
    title: 'Test Hangout',
    description: 'Test Description',
    street1: null,
    street2: null,
    city: null,
    state: null,
    zipCode: null,
    country: null,
    longitude: null,
    latitude: null,
    locationName: null,
    visibility: HangoutVisibility.PUBLIC,
    status: HangoutStatus.PENDING,
    groupDecisionAnonymousVotingEnabled: false,
    groupDecisionAnonymousSuggestionsEnabled: false,
    groupDecisionSuggestionsPerPerson: 1,
    groupDecisionVotesPerPerson: 1,
    groupDecisionSuggestionDeadline: null,
    groupDecisionVotingDeadline: null,
    collaborationMode: false,
    startDateTime: null,
    endDateTime: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    userId: mockUserId,
    user: null as any,
    suggestions: [],
    collaborators: [],
    creator: mockUserId,
    createdBy: mockUserId.toString(),
    location: null,
    activity: null,
    date: null,
    locationDetails: null,
    groupDecisionSettings: null,
  };

  beforeEach(async () => {
    // Mock EntityManager for transactions
    mockManager = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const mockHangoutRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
      manager: {
        transaction: jest.fn(async (callback) => {
          return await callback(mockManager);
        }),
      },
    };

    const mockSuggestionRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const mockCollaboratorRepository = {
      createQueryBuilder: jest.fn(),
      count: jest.fn(),
    };

    const mockInvitationRepository = {
      manager: {
        transaction: jest.fn(async (callback) => {
          return await callback(mockManager);
        }),
      },
      createQueryBuilder: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HangoutsService,
        {
          provide: getRepositoryToken(Hangout),
          useValue: mockHangoutRepository,
        },
        {
          provide: getRepositoryToken(Suggestion),
          useValue: mockSuggestionRepository,
        },
        {
          provide: getRepositoryToken(HangoutCollaborator),
          useValue: mockCollaboratorRepository,
        },
        {
          provide: getRepositoryToken(Invitation),
          useValue: mockInvitationRepository,
        },
      ],
    }).compile();

    service = module.get<HangoutsService>(HangoutsService);
    hangoutRepository = module.get(getRepositoryToken(Hangout));
    invitationRepository = module.get(getRepositoryToken(Invitation));
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  describe('createHangout', () => {
    it('creates a basic hangout with required fields', async () => {
      const input: CreateHangoutInput = {
        title: 'Test Hangout',
        visibility: HangoutVisibility.PUBLIC,
        collaborationMode: false,
      };

      mockManager.create.mockReturnValue(mockHangout);
      mockManager.save.mockResolvedValue(mockHangout);

      const result = await service.createHangout(input, mockUserId);

      expect(result).toEqual(mockHangout);
      expect(mockManager.create).toHaveBeenCalledWith(
        Hangout,
        expect.objectContaining({
          title: 'Test Hangout',
          visibility: HangoutVisibility.PUBLIC,
          collaborationMode: false,
          userId: mockUserId,
        }),
      );
      expect(mockManager.save).toHaveBeenCalledWith(Hangout, mockHangout);
    });

    it('creates a hangout with optional description and location', async () => {
      const input: CreateHangoutInput = {
        title: 'Test Hangout',
        description: 'Test Description',
        location: 'Test Location',
        visibility: HangoutVisibility.PUBLIC,
        collaborationMode: false,
      };

      mockManager.create.mockReturnValue({
        ...mockHangout,
        description: 'Test Description',
        locationName: 'Test Location',
      });
      mockManager.save.mockResolvedValue({
        ...mockHangout,
        description: 'Test Description',
        locationName: 'Test Location',
      });

      const result = await service.createHangout(input, mockUserId);

      expect(result.description).toBe('Test Description');
      expect(result.locationName).toBe('Test Location');
    });

    it('creates a hangout with location details', async () => {
      const input: CreateHangoutInput = {
        title: 'Test Hangout',
        visibility: HangoutVisibility.PUBLIC,
        collaborationMode: false,
        locationDetails: {
          coordinates: {
            latitude: 40.7128,
            longitude: -74.006,
          },
          fullAddress: '123 Main St, New York, NY',
          placedFormatted: 'Main Street',
        },
      };

      mockManager.create.mockReturnValue({
        ...mockHangout,
        latitude: 40.7128,
        longitude: -74.006,
        street1: '123 Main St',
        city: 'New York',
        state: 'NY',
        locationName: 'Main Street',
      });
      mockManager.save.mockResolvedValue({
        ...mockHangout,
        latitude: 40.7128,
        longitude: -74.006,
        street1: '123 Main St',
        city: 'New York',
        state: 'NY',
        locationName: 'Main Street',
      });

      const result = await service.createHangout(input, mockUserId);

      expect(result.latitude).toBe(40.7128);
      expect(result.longitude).toBe(-74.006);
      expect(result.locationName).toBe('Main Street');
    });

    it('creates a hangout with date', async () => {
      const dateStr = '2024-12-31T20:00:00.000Z';
      const input: CreateHangoutInput = {
        title: 'Test Hangout',
        visibility: HangoutVisibility.PUBLIC,
        collaborationMode: false,
        date: dateStr,
      };

      const mockHangoutWithDate = {
        ...mockHangout,
        startDateTime: new Date(dateStr),
      };

      mockManager.create.mockReturnValue(mockHangoutWithDate);
      mockManager.save.mockResolvedValue(mockHangoutWithDate);

      const result = await service.createHangout(input, mockUserId);

      expect(result.startDateTime).toEqual(new Date(dateStr));
    });

    it('throws error for invalid date format', async () => {
      const input: CreateHangoutInput = {
        title: 'Test Hangout',
        visibility: HangoutVisibility.PUBLIC,
        collaborationMode: false,
        date: 'invalid-date',
      };

      await expect(service.createHangout(input, mockUserId)).rejects.toThrow(
        'Invalid date format',
      );
    });

    it('creates a collaboration hangout with group decision settings', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const futureDateStr = futureDate.toISOString();

      const votingDate = new Date(futureDate);
      votingDate.setDate(votingDate.getDate() + 1);
      const votingDateStr = votingDate.toISOString();

      const input: CreateHangoutInput = {
        title: 'Test Hangout',
        visibility: HangoutVisibility.PUBLIC,
        collaborationMode: true,
        groupDecision: {
          voting: {
            anonymousVotes: true,
            anonymousSuggestions: false,
            votesPerPerson: 3,
            optionsPerPerson: 2,
          },
          openForSuggestions: {
            location: true,
            activity: true,
            dateTime: true,
          },
          deadlines: {
            suggestion: futureDateStr,
            voting: votingDateStr,
          },
          notifications: {
            newSuggestions: true,
            votingUpdates: true,
            deadlineReminders: true,
          },
        },
      };

      const mockCollabHangout = {
        ...mockHangout,
        collaborationMode: true,
        groupDecisionAnonymousVotingEnabled: true,
        groupDecisionAnonymousSuggestionsEnabled: false,
        groupDecisionVotesPerPerson: 3,
        groupDecisionSuggestionsPerPerson: 2,
        groupDecisionSuggestionDeadline: futureDate,
        groupDecisionVotingDeadline: votingDate,
      };

      mockManager.create.mockReturnValue(mockCollabHangout);
      mockManager.save.mockResolvedValue(mockCollabHangout);

      const result = await service.createHangout(input, mockUserId);

      expect(result.collaborationMode).toBe(true);
      expect(result.groupDecisionAnonymousVotingEnabled).toBe(true);
      expect(result.groupDecisionVotesPerPerson).toBe(3);
    });

    it('throws error for invalid group decision deadline format', async () => {
      const input: CreateHangoutInput = {
        title: 'Test Hangout',
        visibility: HangoutVisibility.PUBLIC,
        collaborationMode: true,
        groupDecision: {
          voting: {
            anonymousVotes: false,
            anonymousSuggestions: false,
            votesPerPerson: 1,
            optionsPerPerson: 1,
          },
          openForSuggestions: {
            location: true,
            activity: true,
            dateTime: true,
          },
          deadlines: {
            suggestion: 'invalid-date',
            voting: '2024-12-31T20:00:00.000Z',
          },
          notifications: {
            newSuggestions: true,
            votingUpdates: true,
            deadlineReminders: true,
          },
        },
      };

      // Need to return a hangout object for manager.create
      const mockCollabHangout = {
        ...mockHangout,
        collaborationMode: true,
      };

      mockManager.create.mockReturnValue(mockCollabHangout);

      await expect(service.createHangout(input, mockUserId)).rejects.toThrow(
        'Invalid deadline format',
      );
    });

    it('creates location suggestions when provided', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const futureDateStr = futureDate.toISOString();

      const votingDate = new Date(futureDate);
      votingDate.setDate(votingDate.getDate() + 1);
      const votingDateStr = votingDate.toISOString();

      const input: CreateHangoutInput = {
        title: 'Test Hangout',
        visibility: HangoutVisibility.PUBLIC,
        collaborationMode: true,
        groupDecision: {
          voting: {
            anonymousVotes: false,
            anonymousSuggestions: false,
            votesPerPerson: 1,
            optionsPerPerson: 1,
          },
          openForSuggestions: {
            location: true,
            activity: true,
            dateTime: true,
          },
          deadlines: {
            suggestion: futureDateStr,
            voting: votingDateStr,
          },
          notifications: {
            newSuggestions: true,
            votingUpdates: true,
            deadlineReminders: true,
          },
        },
        groupDecisionSuggestions: {
          locations: [
            {
              location: 'Central Park',
              note: 'Great for outdoor activities',
            },
          ],
        },
      };

      const mockCollabHangout = {
        ...mockHangout,
        id: 1,
        collaborationMode: true,
      };

      mockManager.create.mockImplementation((entity: any, data: any) => {
        if (entity === Hangout) {
          return mockCollabHangout;
        }
        return data;
      });
      mockManager.save.mockImplementation((entity: any, data: any) => {
        if (entity === Hangout) {
          return Promise.resolve(mockCollabHangout);
        }
        return Promise.resolve(data);
      });

      await service.createHangout(input, mockUserId);

      expect(mockManager.save).toHaveBeenCalledWith(
        Suggestion,
        expect.arrayContaining([
          expect.objectContaining({
            suggestionType: SuggestionType.LOCATION,
            locationName: 'Central Park',
            notes: 'Great for outdoor activities',
          }),
        ]),
      );
    });

    it('creates activity suggestions when provided', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const futureDateStr = futureDate.toISOString();

      const votingDate = new Date(futureDate);
      votingDate.setDate(votingDate.getDate() + 1);
      const votingDateStr = votingDate.toISOString();

      const input: CreateHangoutInput = {
        title: 'Test Hangout',
        visibility: HangoutVisibility.PUBLIC,
        collaborationMode: true,
        groupDecision: {
          voting: {
            anonymousVotes: false,
            anonymousSuggestions: false,
            votesPerPerson: 1,
            optionsPerPerson: 1,
          },
          openForSuggestions: {
            location: true,
            activity: true,
            dateTime: true,
          },
          deadlines: {
            suggestion: futureDateStr,
            voting: votingDateStr,
          },
          notifications: {
            newSuggestions: true,
            votingUpdates: true,
            deadlineReminders: true,
          },
        },
        groupDecisionSuggestions: {
          activities: [
            {
              activity: 'Hiking',
              note: 'Bring water',
            },
          ],
        },
      };

      const mockCollabHangout = {
        ...mockHangout,
        id: 1,
        collaborationMode: true,
      };

      mockManager.create.mockImplementation((entity: any, data: any) => {
        if (entity === Hangout) {
          return mockCollabHangout;
        }
        return data;
      });
      mockManager.save.mockImplementation((entity: any, data: any) => {
        if (entity === Hangout) {
          return Promise.resolve(mockCollabHangout);
        }
        return Promise.resolve(data);
      });

      await service.createHangout(input, mockUserId);

      expect(mockManager.save).toHaveBeenCalledWith(
        Suggestion,
        expect.arrayContaining([
          expect.objectContaining({
            suggestionType: SuggestionType.ACTIVITY,
            activityName: 'Hiking',
            notes: 'Bring water',
          }),
        ]),
      );
    });

    it('creates date/time suggestions when provided', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const futureDateStr = futureDate.toISOString();

      const votingDate = new Date(futureDate);
      votingDate.setDate(votingDate.getDate() + 1);
      const votingDateStr = votingDate.toISOString();

      const suggestionDate = new Date(futureDate);
      suggestionDate.setDate(suggestionDate.getDate() - 5);
      const suggestionDateStr = suggestionDate.toISOString();

      const input: CreateHangoutInput = {
        title: 'Test Hangout',
        visibility: HangoutVisibility.PUBLIC,
        collaborationMode: true,
        groupDecision: {
          voting: {
            anonymousVotes: false,
            anonymousSuggestions: false,
            votesPerPerson: 1,
            optionsPerPerson: 1,
          },
          openForSuggestions: {
            location: true,
            activity: true,
            dateTime: true,
          },
          deadlines: {
            suggestion: futureDateStr,
            voting: votingDateStr,
          },
          notifications: {
            newSuggestions: true,
            votingUpdates: true,
            deadlineReminders: true,
          },
        },
        groupDecisionSuggestions: {
          dateTimes: [
            {
              dateTime: suggestionDateStr,
              availabilityType: HangoutAvailabilityType.SPECIFIC,
            },
          ],
        },
      };

      const mockCollabHangout = {
        ...mockHangout,
        id: 1,
        collaborationMode: true,
      };

      mockManager.create.mockImplementation((entity: any, data: any) => {
        if (entity === Hangout) {
          return mockCollabHangout;
        }
        return data;
      });
      mockManager.save.mockImplementation((entity: any, data: any) => {
        if (entity === Hangout) {
          return Promise.resolve(mockCollabHangout);
        }
        return Promise.resolve(data);
      });

      await service.createHangout(input, mockUserId);

      expect(mockManager.save).toHaveBeenCalledWith(
        Suggestion,
        expect.arrayContaining([
          expect.objectContaining({
            suggestionType: SuggestionType.TIME,
            suggestedStartTime: suggestionDate,
          }),
        ]),
      );
    });

    it('throws error for invalid date/time suggestions', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const futureDateStr = futureDate.toISOString();

      const votingDate = new Date(futureDate);
      votingDate.setDate(votingDate.getDate() + 1);
      const votingDateStr = votingDate.toISOString();

      const input: CreateHangoutInput = {
        title: 'Test Hangout',
        visibility: HangoutVisibility.PUBLIC,
        collaborationMode: true,
        groupDecision: {
          voting: {
            anonymousVotes: false,
            anonymousSuggestions: false,
            votesPerPerson: 1,
            optionsPerPerson: 1,
          },
          openForSuggestions: {
            location: true,
            activity: true,
            dateTime: true,
          },
          deadlines: {
            suggestion: futureDateStr,
            voting: votingDateStr,
          },
          notifications: {
            newSuggestions: true,
            votingUpdates: true,
            deadlineReminders: true,
          },
        },
        groupDecisionSuggestions: {
          dateTimes: [
            {
              dateTime: 'invalid-date',
              availabilityType: HangoutAvailabilityType.SPECIFIC,
            },
          ],
        },
      };

      const mockCollabHangout = {
        ...mockHangout,
        id: 1,
        collaborationMode: true,
      };

      mockManager.create.mockImplementation((entity: any, data: any) => {
        if (entity === Hangout) {
          return mockCollabHangout;
        }
        return data;
      });
      mockManager.save.mockImplementation((entity: any, data: any) => {
        if (entity === Hangout) {
          return Promise.resolve(mockCollabHangout);
        }
        return Promise.resolve(data);
      });

      await expect(service.createHangout(input, mockUserId)).rejects.toThrow(
        'Invalid date/time suggestion format',
      );
    });

    it('throws error when suggestion deadline is in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const pastDateStr = pastDate.toISOString();

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const futureDateStr = futureDate.toISOString();

      const input: CreateHangoutInput = {
        title: 'Test Hangout',
        visibility: HangoutVisibility.PUBLIC,
        collaborationMode: true,
        groupDecision: {
          voting: {
            anonymousVotes: false,
            anonymousSuggestions: false,
            votesPerPerson: 1,
            optionsPerPerson: 1,
          },
          openForSuggestions: {
            location: true,
            activity: true,
            dateTime: true,
          },
          deadlines: {
            suggestion: pastDateStr,
            voting: futureDateStr,
          },
          notifications: {
            newSuggestions: true,
            votingUpdates: true,
            deadlineReminders: true,
          },
        },
      };

      const mockCollabHangout = {
        ...mockHangout,
        collaborationMode: true,
      };

      mockManager.create.mockReturnValue(mockCollabHangout);

      await expect(service.createHangout(input, mockUserId)).rejects.toThrow(
        'Suggestion deadline must be in the future',
      );
    });

    it('throws error when voting deadline is in the past', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const futureDateStr = futureDate.toISOString();

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const pastDateStr = pastDate.toISOString();

      const input: CreateHangoutInput = {
        title: 'Test Hangout',
        visibility: HangoutVisibility.PUBLIC,
        collaborationMode: true,
        groupDecision: {
          voting: {
            anonymousVotes: false,
            anonymousSuggestions: false,
            votesPerPerson: 1,
            optionsPerPerson: 1,
          },
          openForSuggestions: {
            location: true,
            activity: true,
            dateTime: true,
          },
          deadlines: {
            suggestion: futureDateStr,
            voting: pastDateStr,
          },
          notifications: {
            newSuggestions: true,
            votingUpdates: true,
            deadlineReminders: true,
          },
        },
      };

      const mockCollabHangout = {
        ...mockHangout,
        collaborationMode: true,
      };

      mockManager.create.mockReturnValue(mockCollabHangout);

      await expect(service.createHangout(input, mockUserId)).rejects.toThrow(
        'Voting deadline must be in the future',
      );
    });

    it('throws error when suggestion deadline is not before voting deadline', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const futureDateStr = futureDate.toISOString();

      const laterDate = new Date();
      laterDate.setDate(laterDate.getDate() + 60);
      const laterDateStr = laterDate.toISOString();

      const input: CreateHangoutInput = {
        title: 'Test Hangout',
        visibility: HangoutVisibility.PUBLIC,
        collaborationMode: true,
        groupDecision: {
          voting: {
            anonymousVotes: false,
            anonymousSuggestions: false,
            votesPerPerson: 1,
            optionsPerPerson: 1,
          },
          openForSuggestions: {
            location: true,
            activity: true,
            dateTime: true,
          },
          deadlines: {
            suggestion: laterDateStr,
            voting: futureDateStr,
          },
          notifications: {
            newSuggestions: true,
            votingUpdates: true,
            deadlineReminders: true,
          },
        },
      };

      const mockCollabHangout = {
        ...mockHangout,
        collaborationMode: true,
      };

      mockManager.create.mockReturnValue(mockCollabHangout);

      await expect(service.createHangout(input, mockUserId)).rejects.toThrow(
        'Suggestion deadline must be before voting deadline',
      );
    });
  });

  describe('getHangoutById', () => {
    it('returns a hangout by ID', async () => {
      hangoutRepository.findOne.mockResolvedValue(mockHangout);

      const result = await service.getHangoutById(1);

      expect(result).toEqual(mockHangout);
      expect(hangoutRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('returns null when hangout not found', async () => {
      hangoutRepository.findOne.mockResolvedValue(null);

      const result = await service.getHangoutById(999);

      expect(result).toBeNull();
    });
  });

  describe('getHangoutByUuid', () => {
    it('returns a hangout by UUID', async () => {
      hangoutRepository.findOne.mockResolvedValue(mockHangout);

      const result = await service.getHangoutByUuid('test-uuid-1234');

      expect(result).toEqual(mockHangout);
      expect(hangoutRepository.findOne).toHaveBeenCalledWith({
        where: { uuid: 'test-uuid-1234' },
      });
    });

    it('returns null when hangout not found', async () => {
      hangoutRepository.findOne.mockResolvedValue(null);

      const result = await service.getHangoutByUuid('nonexistent-uuid');

      expect(result).toBeNull();
    });
  });

  describe('getSuggestionsByHangoutId', () => {
    let suggestionRepository: any;

    beforeEach(() => {
      suggestionRepository = {
        find: jest.fn(),
      };
      // Override the suggestionRepository in the service
      (service as any).suggestionRepository = suggestionRepository;
    });

    it('returns suggestions for a hangout ordered by creation date', async () => {
      const mockSuggestions = [
        {
          id: 1,
          uuid: 'suggestion-uuid-1',
          suggestionType: SuggestionType.LOCATION,
          locationName: 'Central Park',
          createdAt: new Date('2024-01-02'),
          userId: 1,
          hangoutId: 1,
        },
        {
          id: 2,
          uuid: 'suggestion-uuid-2',
          suggestionType: SuggestionType.ACTIVITY,
          activityName: 'Hiking',
          createdAt: new Date('2024-01-01'),
          userId: 1,
          hangoutId: 1,
        },
      ];

      suggestionRepository.find.mockResolvedValue(mockSuggestions);

      const result = await service.getSuggestionsByHangoutId(1);

      expect(result).toEqual(mockSuggestions);
      expect(suggestionRepository.find).toHaveBeenCalledWith({
        where: { hangoutId: 1 },
        order: { createdAt: 'DESC' },
      });
    });

    it('returns empty array when no suggestions found', async () => {
      suggestionRepository.find.mockResolvedValue([]);

      const result = await service.getSuggestionsByHangoutId(999);

      expect(result).toEqual([]);
    });
  });

  describe('getHangoutById with authorization', () => {
    it('returns hangout for owner', async () => {
      const hangout = { ...mockHangout, userId: 1, visibility: 'private' };
      hangoutRepository.findOne.mockResolvedValue(hangout);

      const result = await service.getHangoutById(1, 1);

      expect(result).toEqual(hangout);
    });

    it('returns public hangout for non-owner', async () => {
      const hangout = { ...mockHangout, userId: 2, visibility: 'public' };
      hangoutRepository.findOne.mockResolvedValue(hangout);

      const result = await service.getHangoutById(1, 1);

      expect(result).toEqual(hangout);
    });

    it('returns null for private hangout when user is not owner', async () => {
      const hangout = { ...mockHangout, userId: 2, visibility: 'private' };
      hangoutRepository.findOne.mockResolvedValue(hangout);

      const result = await service.getHangoutById(1, 1);

      expect(result).toBeNull();
    });

    it('returns null for friends-only hangout when user is not owner', async () => {
      const hangout = { ...mockHangout, userId: 2, visibility: 'friends' };
      hangoutRepository.findOne.mockResolvedValue(hangout);

      const result = await service.getHangoutById(1, 1);

      expect(result).toBeNull();
    });

    it('returns public hangout when no userId provided', async () => {
      const hangout = { ...mockHangout, visibility: 'public' };
      hangoutRepository.findOne.mockResolvedValue(hangout);

      const result = await service.getHangoutById(1);

      expect(result).toEqual(hangout);
    });

    it('returns null for private hangout when no userId provided', async () => {
      const hangout = { ...mockHangout, visibility: 'private' };
      hangoutRepository.findOne.mockResolvedValue(hangout);

      const result = await service.getHangoutById(1);

      expect(result).toBeNull();
    });

    it('returns null when hangout not found', async () => {
      hangoutRepository.findOne.mockResolvedValue(null);

      const result = await service.getHangoutById(999, 1);

      expect(result).toBeNull();
    });
  });

  describe('deleteHangout', () => {
    it('successfully deletes a hangout owned by the user', async () => {
      const hangoutId = 1;
      const userId = 1;

      hangoutRepository.findOne.mockResolvedValue({
        ...mockHangout,
        id: hangoutId,
        userId,
      });
      hangoutRepository.delete.mockResolvedValue({ affected: 1, raw: [] });

      const result = await service.deleteHangout(hangoutId, userId);

      expect(result).toBe(true);
      expect(hangoutRepository.findOne).toHaveBeenCalledWith({
        where: { id: hangoutId },
      });
      expect(hangoutRepository.delete).toHaveBeenCalledWith({ id: hangoutId });
    });

    it('throws HangoutNotFoundError when hangout not found', async () => {
      hangoutRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteHangout(999, 1)).rejects.toThrow(
        'Hangout not found',
      );
    });

    it('throws HangoutUnauthorizedError when user is not the creator', async () => {
      hangoutRepository.findOne.mockResolvedValue({
        ...mockHangout,
        id: 1,
        userId: 2, // Different user
      });

      await expect(service.deleteHangout(1, 1)).rejects.toThrow(
        'Not authorized to delete this hangout',
      );

      expect(hangoutRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('getHangouts', () => {
    type MockQueryBuilder = {
      where: jest.Mock<MockQueryBuilder, [string, Record<string, unknown>]>;
      andWhere: jest.Mock<MockQueryBuilder, [string, Record<string, unknown>]>;
      orderBy: jest.Mock<MockQueryBuilder, [string, 'ASC' | 'DESC']>;
      skip: jest.Mock<MockQueryBuilder, [number]>;
      take: jest.Mock<MockQueryBuilder, [number]>;
      getCount: jest.Mock<Promise<number>, []>;
      getMany: jest.Mock<Promise<Hangout[]>, []>;
    };

    let queryBuilder: MockQueryBuilder;

    beforeEach(() => {
      queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn(),
        getMany: jest.fn(),
      };
      hangoutRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    });

    it('returns hangouts for a user with default pagination', async () => {
      const userId = 1;
      const mockHangouts = [mockHangout];

      queryBuilder.getCount.mockResolvedValue(1);
      queryBuilder.getMany.mockResolvedValue(mockHangouts);

      const result = await service.getHangouts(userId);

      expect(result).toEqual({
        hangouts: mockHangouts,
        nextToken: undefined,
        total: 1,
      });
      expect(queryBuilder.where).toHaveBeenCalledWith(
        '(hangout.user_id = :userId OR hangout.visibility = :publicVisibility)',
        { userId, publicVisibility: 'public' },
      );
      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'hangout.created_at',
        'DESC',
      );
      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
      expect(queryBuilder.take).toHaveBeenCalledWith(20);
    });

    it('applies search filter', async () => {
      const userId = 1;
      queryBuilder.getCount.mockResolvedValue(0);
      queryBuilder.getMany.mockResolvedValue([]);

      await service.getHangouts(userId, { search: 'test' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '(hangout.title ILIKE :search OR hangout.description ILIKE :search OR hangout.location_name ILIKE :search)',
        { search: '%test%' },
      );
    });

    it('sanitizes search input to prevent SQL injection', async () => {
      const userId = 1;
      queryBuilder.getCount.mockResolvedValue(0);
      queryBuilder.getMany.mockResolvedValue([]);

      await service.getHangouts(userId, { search: 'test%_\\malicious' });

      // Should escape special LIKE characters
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '(hangout.title ILIKE :search OR hangout.description ILIKE :search OR hangout.location_name ILIKE :search)',
        { search: '%test\\%\\_\\\\malicious%' },
      );
    });

    it('applies date filters', async () => {
      const userId = 1;
      const startDate = '2024-01-01T00:00:00.000Z';
      const endDate = '2024-12-31T23:59:59.999Z';

      queryBuilder.getCount.mockResolvedValue(0);
      queryBuilder.getMany.mockResolvedValue([]);

      await service.getHangouts(userId, { startDate, endDate });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'hangout.start_date_time >= :startDate',
        { startDate: new Date(startDate) },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'hangout.start_date_time <= :endDate',
        { endDate: new Date(endDate) },
      );
    });

    it('applies collaboration mode filter', async () => {
      const userId = 1;
      queryBuilder.getCount.mockResolvedValue(0);
      queryBuilder.getMany.mockResolvedValue([]);

      await service.getHangouts(userId, { collaborationMode: true });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'hangout.collaboration_mode = :collaborationMode',
        { collaborationMode: true },
      );
    });

    it('applies status filter', async () => {
      const userId = 1;
      queryBuilder.getCount.mockResolvedValue(0);
      queryBuilder.getMany.mockResolvedValue([]);

      await service.getHangouts(userId, { status: HangoutStatus.PENDING });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'hangout.status = :status',
        { status: HangoutStatus.PENDING },
      );
    });

    it('handles pagination with nextToken', async () => {
      const userId = 1;
      const mockHangouts = Array(20).fill(mockHangout);

      queryBuilder.getCount.mockResolvedValue(40);
      queryBuilder.getMany.mockResolvedValue(mockHangouts);

      const result = await service.getHangouts(userId, {
        limit: 20,
        nextToken: '20',
      });

      expect(result).toEqual({
        hangouts: mockHangouts,
        nextToken: '40',
        total: 40,
      });
      expect(queryBuilder.skip).toHaveBeenCalledWith(20);
      expect(queryBuilder.take).toHaveBeenCalledWith(20);
    });

    it('returns no nextToken when no more results', async () => {
      const userId = 1;
      const mockHangouts = Array(10).fill(mockHangout);

      queryBuilder.getCount.mockResolvedValue(10);
      queryBuilder.getMany.mockResolvedValue(mockHangouts);

      const result = await service.getHangouts(userId, { limit: 20 });

      expect(result).toEqual({
        hangouts: mockHangouts,
        nextToken: undefined,
        total: 10,
      });
    });

    it('throws InvalidPaginationTokenError for invalid nextToken', async () => {
      const userId = 1;

      await expect(
        service.getHangouts(userId, { nextToken: 'invalid' }),
      ).rejects.toThrow('Invalid pagination token');

      // QueryBuilder should not be called for invalid token
      expect(queryBuilder.getCount).not.toHaveBeenCalled();
      expect(queryBuilder.getMany).not.toHaveBeenCalled();
    });
  });

  describe('getCollaborators', () => {
    let collaboratorRepository: any;
    let queryBuilder: any;

    const mockCollaborator1: HangoutCollaborator = {
      id: 1,
      uuid: 'collab-uuid-1',
      hangoutId: 1,
      userId: 2,
      role: 'collaborator' as any,
      invitedBy: 1,
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:00:00Z'),
      hangout: null as any,
      user: null as any,
      inviter: null as any,
    };

    const mockCollaborator2: HangoutCollaborator = {
      id: 2,
      uuid: 'collab-uuid-2',
      hangoutId: 1,
      userId: 3,
      role: 'organizer' as any,
      invitedBy: 1,
      createdAt: new Date('2024-01-01T11:00:00Z'),
      updatedAt: new Date('2024-01-01T11:00:00Z'),
      hangout: null as any,
      user: null as any,
      inviter: null as any,
    };

    beforeEach(() => {
      queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };

      collaboratorRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
        count: jest.fn(),
      };

      // Replace the mock in the service
      (service as any).collaboratorRepository = collaboratorRepository;
    });

    it('returns paginated collaborators with forward pagination', async () => {
      const hangoutId = 1;
      const mockCollaborators = [mockCollaborator1, mockCollaborator2];

      queryBuilder.getMany.mockResolvedValue(mockCollaborators);
      collaboratorRepository.count.mockResolvedValue(2);

      const result = await service.getCollaborators(hangoutId, {
        first: 20,
      });

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'collaborator.hangout_id = :hangoutId',
        { hangoutId },
      );
      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'collaborator.created_at',
        'ASC',
      );
      expect(queryBuilder.take).toHaveBeenCalledWith(21); // pageSize + 1

      expect(result.edges).toHaveLength(2);
      expect(result.edges[0].node).toEqual(mockCollaborator1);
      expect(result.edges[1].node).toEqual(mockCollaborator2);
      expect(result.totalCount).toBe(2);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
    });

    it('returns collaborators with cursor-based forward pagination', async () => {
      const hangoutId = 1;
      const afterCursor = Buffer.from('2024-01-01T10:00:00Z').toString(
        'base64',
      );

      queryBuilder.getMany.mockResolvedValue([mockCollaborator2]);
      collaboratorRepository.count.mockResolvedValue(2);

      const result = await service.getCollaborators(hangoutId, {
        first: 20,
        after: afterCursor,
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'collaborator.created_at > :afterDate',
        { afterDate: new Date('2024-01-01T10:00:00Z') },
      );
      expect(result.edges).toHaveLength(1);
      expect(result.edges[0].node).toEqual(mockCollaborator2);
    });

    it('returns collaborators with backward pagination using last', async () => {
      const hangoutId = 1;
      const mockCollaborators = [mockCollaborator2, mockCollaborator1]; // Reversed order

      queryBuilder.getMany.mockResolvedValue(mockCollaborators);
      collaboratorRepository.count.mockResolvedValue(2);

      const result = await service.getCollaborators(hangoutId, {
        last: 20,
      });

      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'collaborator.created_at',
        'DESC',
      );

      // Results should be reversed back to correct order
      expect(result.edges).toHaveLength(2);
      expect(result.edges[0].node).toEqual(mockCollaborator1);
      expect(result.edges[1].node).toEqual(mockCollaborator2);
    });

    it('indicates hasNextPage when more results exist', async () => {
      const hangoutId = 1;
      const mockCollaborators = Array(21)
        .fill(null)
        .map((_, i) => ({
          ...mockCollaborator1,
          id: i + 1,
          createdAt: new Date(
            new Date('2024-01-01T10:00:00Z').getTime() + i * 60000,
          ), // Add i minutes
        }));

      queryBuilder.getMany.mockResolvedValue(mockCollaborators);
      collaboratorRepository.count.mockResolvedValue(21);

      const result = await service.getCollaborators(hangoutId, {
        first: 20,
      });

      // Should have 20 items (one removed as extra)
      expect(result.edges).toHaveLength(20);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
    });

    it('returns empty connection when no collaborators exist', async () => {
      const hangoutId = 1;

      queryBuilder.getMany.mockResolvedValue([]);
      collaboratorRepository.count.mockResolvedValue(0);

      const result = await service.getCollaborators(hangoutId, {
        first: 20,
      });

      expect(result.edges).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).toBeNull();
      expect(result.pageInfo.endCursor).toBeNull();
    });

    it('uses default page size of 20 when no pagination params provided', async () => {
      const hangoutId = 1;

      queryBuilder.getMany.mockResolvedValue([mockCollaborator1]);
      collaboratorRepository.count.mockResolvedValue(1);

      await service.getCollaborators(hangoutId, {});

      expect(queryBuilder.take).toHaveBeenCalledWith(21); // 20 + 1
    });

    it('throws error when both first and last are provided', async () => {
      const hangoutId = 1;

      await expect(
        service.getCollaborators(hangoutId, { first: 10, last: 10 }),
      ).rejects.toThrow('Cannot use both first and last parameters');
    });

    it('throws error for negative first parameter', async () => {
      const hangoutId = 1;

      await expect(
        service.getCollaborators(hangoutId, { first: -1 }),
      ).rejects.toThrow('first parameter must be non-negative');
    });

    it('throws error for negative last parameter', async () => {
      const hangoutId = 1;

      await expect(
        service.getCollaborators(hangoutId, { last: -1 }),
      ).rejects.toThrow('last parameter must be non-negative');
    });

    it('throws error for invalid after cursor', async () => {
      const hangoutId = 1;

      await expect(
        service.getCollaborators(hangoutId, {
          first: 20,
          after: 'invalid-cursor',
        }),
      ).rejects.toThrow('Invalid after cursor');
    });

    it('throws error for invalid before cursor', async () => {
      const hangoutId = 1;

      await expect(
        service.getCollaborators(hangoutId, {
          first: 20,
          before: 'invalid-cursor',
        }),
      ).rejects.toThrow('Invalid before cursor');
    });

    it('correctly encodes cursors as base64 timestamps', async () => {
      const hangoutId = 1;

      queryBuilder.getMany.mockResolvedValue([mockCollaborator1]);
      collaboratorRepository.count.mockResolvedValue(1);

      const result = await service.getCollaborators(hangoutId, {
        first: 20,
      });

      const decodedCursor = Buffer.from(
        result.edges[0].cursor,
        'base64',
      ).toString('utf-8');
      expect(decodedCursor).toBe('2024-01-01T10:00:00.000Z');
    });

    it('includes user relation in query', async () => {
      const hangoutId = 1;

      queryBuilder.getMany.mockResolvedValue([mockCollaborator1]);
      collaboratorRepository.count.mockResolvedValue(1);

      await service.getCollaborators(hangoutId, { first: 20 });

      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'collaborator.user',
        'user',
      );
    });
  });

  describe('updateHangout', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('updates a hangout with all fields', async () => {
      const futureDate1 = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString(); // 7 days from now
      const futureDate2 = new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000,
      ).toISOString(); // 14 days from now
      const futureDate3 = new Date(
        Date.now() + 21 * 24 * 60 * 60 * 1000,
      ).toISOString(); // 21 days from now

      const updateInput = {
        id: 1,
        title: 'Updated Title',
        description: 'Updated Description',
        location: 'Updated Location',
        date: futureDate3,
        visibility: HangoutVisibility.PRIVATE,
        status: HangoutStatus.FINALIZED,
        collaborationMode: true,
        locationDetails: {
          coordinates: { latitude: 40.7128, longitude: -74.006 },
          fullAddress: '123 Main St, New York, NY',
          placedFormatted: 'Central Park',
        },
        groupDecision: {
          voting: {
            anonymousVotes: true,
            anonymousSuggestions: true,
            votesPerPerson: 3,
            optionsPerPerson: 2,
          },
          openForSuggestions: {
            location: true,
            activity: true,
            dateTime: true,
          },
          deadlines: {
            suggestion: futureDate1,
            voting: futureDate2,
          },
          notifications: {
            newSuggestions: true,
            votingUpdates: true,
            deadlineReminders: true,
          },
        },
      };

      const updatedHangout = { ...mockHangout, ...updateInput };

      mockManager.findOne.mockResolvedValue(mockHangout);
      mockManager.save.mockResolvedValue(updatedHangout);

      const result = await service.updateHangout(updateInput, mockUserId);

      expect(mockManager.findOne).toHaveBeenCalledWith(Hangout, {
        where: { id: updateInput.id },
      });
      expect(mockManager.save).toHaveBeenCalledWith(
        Hangout,
        expect.any(Object),
      );
      expect(result).toEqual(updatedHangout);
    });

    it('throws HangoutNotFoundError when hangout does not exist', async () => {
      const updateInput = {
        id: 999,
        title: 'Updated Title',
      };

      mockManager.findOne.mockResolvedValue(null);

      await expect(
        service.updateHangout(updateInput, mockUserId),
      ).rejects.toThrow('Hangout not found');
    });

    it('throws HangoutUnauthorizedError when user is not the creator', async () => {
      const updateInput = {
        id: 1,
        title: 'Updated Title',
      };

      mockManager.findOne.mockResolvedValue({
        ...mockHangout,
        userId: 999, // Different user
      });

      await expect(
        service.updateHangout(updateInput, mockUserId),
      ).rejects.toThrow('Not authorized to update this hangout');
    });

    it('updates only provided fields', async () => {
      const updateInput = {
        id: 1,
        title: 'Updated Title',
        // Other fields omitted
      };

      const updatedHangout = { ...mockHangout, title: updateInput.title };

      mockManager.findOne.mockResolvedValue(mockHangout);
      mockManager.save.mockResolvedValue(updatedHangout);

      const result = await service.updateHangout(updateInput, mockUserId);

      expect(result.title).toBe(updateInput.title);
      expect(result.description).toBe(mockHangout.description); // Unchanged
    });

    it('clears date when empty string is provided', async () => {
      const updateInput = {
        id: 1,
        date: '',
      };

      const updatedHangout = { ...mockHangout, startDateTime: null };

      mockManager.findOne.mockResolvedValue(mockHangout);
      mockManager.save.mockResolvedValue(updatedHangout);

      const result = await service.updateHangout(updateInput, mockUserId);

      expect(result.startDateTime).toBeNull();
    });

    it('throws error for invalid date format', async () => {
      const updateInput = {
        id: 1,
        date: 'invalid-date',
      };

      mockManager.findOne.mockResolvedValue(mockHangout);

      await expect(
        service.updateHangout(updateInput, mockUserId),
      ).rejects.toThrow('Invalid date format');
    });

    it('clears location details when null is provided', async () => {
      const updateInput = {
        id: 1,
        locationDetails: null,
      };

      const updatedHangout = {
        ...mockHangout,
        street1: null,
        latitude: null,
        longitude: null,
      };

      mockManager.findOne.mockResolvedValue(mockHangout);
      mockManager.save.mockResolvedValue(updatedHangout);

      const result = await service.updateHangout(updateInput, mockUserId);

      expect(result.latitude).toBeNull();
      expect(result.longitude).toBeNull();
    });

    it('validates group decision deadlines are in the future', async () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString(); // Yesterday
      const futureDate = new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000,
      ).toISOString(); // 14 days from now

      const updateInput = {
        id: 1,
        collaborationMode: true,
        groupDecision: {
          voting: {
            anonymousVotes: true,
            anonymousSuggestions: true,
            votesPerPerson: 1,
            optionsPerPerson: 1,
          },
          openForSuggestions: {
            location: true,
            activity: true,
            dateTime: true,
          },
          deadlines: {
            suggestion: pastDate,
            voting: futureDate,
          },
          notifications: {
            newSuggestions: true,
            votingUpdates: true,
            deadlineReminders: true,
          },
        },
      };

      mockManager.findOne.mockResolvedValue(mockHangout);

      await expect(
        service.updateHangout(updateInput, mockUserId),
      ).rejects.toThrow('Suggestion deadline must be in the future');
    });

    it('validates suggestion deadline is before voting deadline', async () => {
      const futureDate1 = new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000,
      ).toISOString(); // 14 days from now
      const futureDate2 = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString(); // 7 days from now (before suggestion deadline)

      const updateInput = {
        id: 1,
        collaborationMode: true,
        groupDecision: {
          voting: {
            anonymousVotes: true,
            anonymousSuggestions: true,
            votesPerPerson: 1,
            optionsPerPerson: 1,
          },
          openForSuggestions: {
            location: true,
            activity: true,
            dateTime: true,
          },
          deadlines: {
            suggestion: futureDate1,
            voting: futureDate2, // Before suggestion deadline
          },
          notifications: {
            newSuggestions: true,
            votingUpdates: true,
            deadlineReminders: true,
          },
        },
      };

      mockManager.findOne.mockResolvedValue(mockHangout);

      await expect(
        service.updateHangout(updateInput, mockUserId),
      ).rejects.toThrow('Suggestion deadline must be before voting deadline');
    });
  });

  describe('addCollaborator', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      const collaboratorManager = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      };
      (service as any).collaboratorRepository = {
        manager: {
          transaction: jest.fn(async (callback) => {
            return await callback(collaboratorManager);
          }),
        },
      };
      // Store reference for tests to access
      (service as any).collaboratorManager = collaboratorManager;
    });

    it('adds a collaborator to a hangout', async () => {
      const addInput = {
        hangoutId: 1,
        userId: 2,
        role: 'collaborator' as any,
      };

      const collaborationHangout = {
        ...mockHangout,
        collaborationMode: true,
      };

      const mockCollaborator = {
        id: 1,
        uuid: 'test-uuid-1234',
        hangoutId: 1,
        userId: 2,
        role: 'collaborator',
        invitedBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const collaboratorManager = (service as any).collaboratorManager;
      collaboratorManager.findOne.mockResolvedValueOnce(collaborationHangout); // Hangout lookup
      collaboratorManager.findOne.mockResolvedValueOnce(null); // No existing collaborator
      collaboratorManager.create.mockReturnValue(mockCollaborator);
      collaboratorManager.save.mockResolvedValue(mockCollaborator);

      const result = await service.addCollaborator(addInput, mockUserId);

      expect(collaboratorManager.findOne).toHaveBeenCalledWith(Hangout, {
        where: { id: addInput.hangoutId },
      });
      expect(result).toEqual(mockCollaborator);
    });

    it('throws HangoutNotFoundError when hangout does not exist', async () => {
      const addInput = {
        hangoutId: 999,
        userId: 2,
      };

      const collaboratorManager = (service as any).collaboratorManager;
      collaboratorManager.findOne.mockResolvedValue(null);

      await expect(
        service.addCollaborator(addInput, mockUserId),
      ).rejects.toThrow('Hangout not found');
    });

    it('throws HangoutUnauthorizedError when user is not the creator', async () => {
      const addInput = {
        hangoutId: 1,
        userId: 2,
      };

      const collaboratorManager = (service as any).collaboratorManager;
      collaboratorManager.findOne.mockResolvedValue({
        ...mockHangout,
        userId: 999,
        collaborationMode: true,
      });

      await expect(
        service.addCollaborator(addInput, mockUserId),
      ).rejects.toThrow('Not authorized to add collaborators to this hangout');
    });

    it('throws error when hangout is not in collaboration mode', async () => {
      const addInput = {
        hangoutId: 1,
        userId: 2,
      };

      const collaboratorManager = (service as any).collaboratorManager;
      collaboratorManager.findOne.mockResolvedValue({
        ...mockHangout,
        collaborationMode: false,
      });

      await expect(
        service.addCollaborator(addInput, mockUserId),
      ).rejects.toThrow(
        'Cannot add collaborators to a hangout not in collaboration mode',
      );
    });

    it('throws error when user is already a collaborator', async () => {
      const addInput = {
        hangoutId: 1,
        userId: 2,
      };

      const existingCollaborator = {
        id: 1,
        userId: 2,
        hangoutId: 1,
      };

      const collaboratorManager = (service as any).collaboratorManager;
      collaboratorManager.findOne.mockResolvedValueOnce({
        ...mockHangout,
        collaborationMode: true,
      });
      collaboratorManager.findOne.mockResolvedValueOnce(existingCollaborator);

      await expect(
        service.addCollaborator(addInput, mockUserId),
      ).rejects.toThrow('User is already a collaborator on this hangout');
    });

    it('sets invitedBy field to requesting user', async () => {
      const addInput = {
        hangoutId: 1,
        userId: 2,
      };

      const collaborationHangout = {
        ...mockHangout,
        collaborationMode: true,
      };

      const collaboratorManager = (service as any).collaboratorManager;
      collaboratorManager.findOne.mockResolvedValueOnce(collaborationHangout);
      collaboratorManager.findOne.mockResolvedValueOnce(null);
      collaboratorManager.create.mockImplementation((entity, data) => data);
      collaboratorManager.save.mockResolvedValue({});

      await service.addCollaborator(addInput, mockUserId);

      expect(collaboratorManager.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          invitedBy: mockUserId,
        }),
      );
    });
  });

  describe('removeCollaborator', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      const removeManager = {
        findOne: jest.fn(),
        delete: jest.fn(),
      };
      (service as any).collaboratorRepository = {
        manager: {
          transaction: jest.fn(async (callback) => {
            return await callback(removeManager);
          }),
        },
      };
      // Store reference for tests to access
      (service as any).removeManager = removeManager;
    });

    it('removes a collaborator from a hangout', async () => {
      const removeInput = {
        hangoutId: 1,
        userId: 2,
      };

      const mockCollaborator = {
        id: 1,
        hangoutId: 1,
        userId: 2,
        role: 'collaborator' as any,
      };

      const removeManager = (service as any).removeManager;
      removeManager.findOne.mockResolvedValueOnce(mockHangout); // Hangout lookup
      removeManager.findOne.mockResolvedValueOnce(mockCollaborator); // Collaborator lookup
      removeManager.delete.mockResolvedValue({ affected: 1 });

      const result = await service.removeCollaborator(removeInput, mockUserId);

      expect(removeManager.findOne).toHaveBeenCalledWith(Hangout, {
        where: { id: removeInput.hangoutId },
      });
      expect(removeManager.delete).toHaveBeenCalledWith(expect.anything(), {
        id: mockCollaborator.id,
      });
      expect(result).toBe(true);
    });

    it('throws HangoutNotFoundError when hangout does not exist', async () => {
      const removeInput = {
        hangoutId: 999,
        userId: 2,
      };

      const removeManager = (service as any).removeManager;
      removeManager.findOne.mockResolvedValue(null);

      await expect(
        service.removeCollaborator(removeInput, mockUserId),
      ).rejects.toThrow('Hangout not found');
    });

    it('throws HangoutUnauthorizedError when user is not the creator', async () => {
      const removeInput = {
        hangoutId: 1,
        userId: 2,
      };

      const removeManager = (service as any).removeManager;
      removeManager.findOne.mockResolvedValue({
        ...mockHangout,
        userId: 999,
      });

      await expect(
        service.removeCollaborator(removeInput, mockUserId),
      ).rejects.toThrow(
        'Not authorized to remove collaborators from this hangout',
      );
    });

    it('throws error when collaborator does not exist', async () => {
      const removeInput = {
        hangoutId: 1,
        userId: 2,
      };

      const removeManager = (service as any).removeManager;
      removeManager.findOne.mockResolvedValueOnce(mockHangout);
      removeManager.findOne.mockResolvedValueOnce(null);

      await expect(
        service.removeCollaborator(removeInput, mockUserId),
      ).rejects.toThrow('User is not a collaborator on this hangout');
    });

    it('throws error when trying to remove organizer', async () => {
      const removeInput = {
        hangoutId: 1,
        userId: 2,
      };

      const organizerCollaborator = {
        id: 1,
        hangoutId: 1,
        userId: 2,
        role: 'organizer' as any,
      };

      const removeManager = (service as any).removeManager;
      removeManager.findOne.mockResolvedValueOnce(mockHangout);
      removeManager.findOne.mockResolvedValueOnce(organizerCollaborator);

      await expect(
        service.removeCollaborator(removeInput, mockUserId),
      ).rejects.toThrow('Cannot remove the organizer from the hangout');
    });
  });

  describe('inviteUser', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      const inviteManager = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      };
      (service as any).invitationRepository = {
        manager: {
          transaction: jest.fn(async (callback) => {
            return await callback(inviteManager);
          }),
        },
      };
      (service as any).inviteManager = inviteManager;
    });

    it('invites a user to a hangout', async () => {
      const inviteInput = {
        hangoutId: 1,
        inviteeId: 2,
        message: 'Come join us!',
      };

      const mockInvitation = {
        id: 1,
        uuid: 'test-uuid-1234',
        hangoutId: 1,
        inviteeId: 2,
        inviterId: mockUserId,
        status: InvitationStatus.PENDING,
        message: 'Come join us!',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const inviteManager = (service as any).inviteManager;
      inviteManager.findOne.mockResolvedValueOnce(mockHangout); // Hangout lookup
      inviteManager.findOne.mockResolvedValueOnce(null); // No existing invitation
      inviteManager.create.mockReturnValue(mockInvitation);
      inviteManager.save.mockResolvedValue(mockInvitation);

      const result = await service.inviteUser(inviteInput, mockUserId);

      expect(inviteManager.findOne).toHaveBeenCalledWith(Hangout, {
        where: { id: inviteInput.hangoutId },
      });
      expect(result).toEqual(mockInvitation);
    });

    it('allows collaborators to invite users in collaboration mode', async () => {
      const inviteInput = {
        hangoutId: 1,
        inviteeId: 3,
      };

      const collaborationHangout = {
        ...mockHangout,
        userId: 999, // Different creator
        collaborationMode: true,
      };

      const mockCollaborator = {
        id: 1,
        hangoutId: 1,
        userId: mockUserId,
        role: 'collaborator' as any,
      };

      const mockInvitation = {
        id: 1,
        uuid: 'test-uuid-1234',
        hangoutId: 1,
        inviteeId: 3,
        inviterId: mockUserId,
        status: InvitationStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const inviteManager = (service as any).inviteManager;
      inviteManager.findOne.mockResolvedValueOnce(collaborationHangout); // Hangout lookup
      inviteManager.findOne.mockResolvedValueOnce(mockCollaborator); // Collaborator check
      inviteManager.findOne.mockResolvedValueOnce(null); // No existing invitation
      inviteManager.create.mockReturnValue(mockInvitation);
      inviteManager.save.mockResolvedValue(mockInvitation);

      const result = await service.inviteUser(inviteInput, mockUserId);

      expect(result).toEqual(mockInvitation);
    });

    it('throws HangoutNotFoundError when hangout does not exist', async () => {
      const inviteInput = {
        hangoutId: 999,
        inviteeId: 2,
      };

      const inviteManager = (service as any).inviteManager;
      inviteManager.findOne.mockResolvedValue(null);

      await expect(service.inviteUser(inviteInput, mockUserId)).rejects.toThrow(
        'Hangout not found',
      );
    });

    it('throws HangoutUnauthorizedError when user is not creator or collaborator', async () => {
      const inviteInput = {
        hangoutId: 1,
        inviteeId: 2,
      };

      const otherUserHangout = {
        ...mockHangout,
        userId: 999,
        collaborationMode: false,
      };

      const inviteManager = (service as any).inviteManager;
      inviteManager.findOne.mockResolvedValue(otherUserHangout);

      await expect(service.inviteUser(inviteInput, mockUserId)).rejects.toThrow(
        'Not authorized to invite users to this hangout',
      );
    });

    it('throws error when user is already invited', async () => {
      const inviteInput = {
        hangoutId: 1,
        inviteeId: 2,
      };

      const existingInvitation = {
        id: 1,
        hangoutId: 1,
        inviteeId: 2,
        status: InvitationStatus.PENDING,
      };

      const inviteManager = (service as any).inviteManager;
      inviteManager.findOne.mockResolvedValueOnce(mockHangout);
      inviteManager.findOne.mockResolvedValueOnce(existingInvitation);

      await expect(service.inviteUser(inviteInput, mockUserId)).rejects.toThrow(
        'User is already invited to this hangout',
      );
    });

    it('throws error when trying to invite yourself', async () => {
      const inviteInput = {
        hangoutId: 1,
        inviteeId: mockUserId, // Same as requesting user
      };

      const inviteManager = (service as any).inviteManager;
      inviteManager.findOne.mockResolvedValueOnce(mockHangout);
      inviteManager.findOne.mockResolvedValueOnce(null);

      await expect(service.inviteUser(inviteInput, mockUserId)).rejects.toThrow(
        'Cannot invite yourself to a hangout',
      );
    });
  });

  describe('uninviteUser', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      const uninviteManager = {
        findOne: jest.fn(),
        delete: jest.fn(),
      };
      (service as any).invitationRepository = {
        manager: {
          transaction: jest.fn(async (callback) => {
            return await callback(uninviteManager);
          }),
        },
      };
      (service as any).uninviteManager = uninviteManager;
    });

    it('removes an invitation from a hangout', async () => {
      const uninviteInput = {
        hangoutId: 1,
        inviteeId: 2,
      };

      const mockInvitation = {
        id: 1,
        hangoutId: 1,
        inviteeId: 2,
        inviterId: mockUserId,
        status: InvitationStatus.PENDING,
      };

      const uninviteManager = (service as any).uninviteManager;
      uninviteManager.findOne.mockResolvedValueOnce(mockHangout);
      uninviteManager.findOne.mockResolvedValueOnce(mockInvitation);
      uninviteManager.delete.mockResolvedValue({ affected: 1 });

      const result = await service.uninviteUser(uninviteInput, mockUserId);

      expect(uninviteManager.delete).toHaveBeenCalledWith(Invitation, {
        id: mockInvitation.id,
      });
      expect(result).toBe(true);
    });

    it('allows inviter to remove their own invitation', async () => {
      const uninviteInput = {
        hangoutId: 1,
        inviteeId: 2,
      };

      const otherUserHangout = {
        ...mockHangout,
        userId: 999, // Different creator
      };

      const mockInvitation = {
        id: 1,
        hangoutId: 1,
        inviteeId: 2,
        inviterId: mockUserId, // Current user is inviter
        status: InvitationStatus.PENDING,
      };

      const uninviteManager = (service as any).uninviteManager;
      uninviteManager.findOne.mockResolvedValueOnce(otherUserHangout);
      uninviteManager.findOne.mockResolvedValueOnce(mockInvitation);
      uninviteManager.delete.mockResolvedValue({ affected: 1 });

      const result = await service.uninviteUser(uninviteInput, mockUserId);

      expect(result).toBe(true);
    });

    it('throws HangoutNotFoundError when hangout does not exist', async () => {
      const uninviteInput = {
        hangoutId: 999,
        inviteeId: 2,
      };

      const uninviteManager = (service as any).uninviteManager;
      uninviteManager.findOne.mockResolvedValue(null);

      await expect(
        service.uninviteUser(uninviteInput, mockUserId),
      ).rejects.toThrow('Hangout not found');
    });

    it('throws error when invitation does not exist', async () => {
      const uninviteInput = {
        hangoutId: 1,
        inviteeId: 2,
      };

      const uninviteManager = (service as any).uninviteManager;
      uninviteManager.findOne.mockResolvedValueOnce(mockHangout);
      uninviteManager.findOne.mockResolvedValueOnce(null);

      await expect(
        service.uninviteUser(uninviteInput, mockUserId),
      ).rejects.toThrow('User is not invited to this hangout');
    });

    it('throws HangoutUnauthorizedError when user is not creator or inviter', async () => {
      const uninviteInput = {
        hangoutId: 1,
        inviteeId: 2,
      };

      const otherUserHangout = {
        ...mockHangout,
        userId: 999,
      };

      const mockInvitation = {
        id: 1,
        hangoutId: 1,
        inviteeId: 2,
        inviterId: 888, // Different inviter
        status: InvitationStatus.PENDING,
      };

      const uninviteManager = (service as any).uninviteManager;
      uninviteManager.findOne.mockResolvedValueOnce(otherUserHangout);
      uninviteManager.findOne.mockResolvedValueOnce(mockInvitation);

      await expect(
        service.uninviteUser(uninviteInput, mockUserId),
      ).rejects.toThrow('Not authorized to remove this invitation');
    });
  });

  describe('respondToInvitation', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      const respondManager = {
        findOne: jest.fn(),
        save: jest.fn(),
      };
      (service as any).invitationRepository = {
        manager: {
          transaction: jest.fn(async (callback) => {
            return await callback(respondManager);
          }),
        },
      };
      (service as any).respondManager = respondManager;
    });

    it('accepts an invitation', async () => {
      const respondInput = {
        invitationId: 1,
        status: InvitationStatus.ACCEPTED,
      };

      const mockInvitation = {
        id: 1,
        hangoutId: 1,
        inviteeId: mockUserId,
        inviterId: 2,
        status: InvitationStatus.PENDING,
        respondedAt: null,
      };

      const updatedInvitation = {
        ...mockInvitation,
        status: InvitationStatus.ACCEPTED,
        respondedAt: expect.any(Date),
      };

      const respondManager = (service as any).respondManager;
      respondManager.findOne.mockResolvedValue(mockInvitation);
      respondManager.save.mockResolvedValue(updatedInvitation);

      const result = await service.respondToInvitation(
        respondInput,
        mockUserId,
      );

      expect(result.status).toBe(InvitationStatus.ACCEPTED);
      expect(respondManager.save).toHaveBeenCalled();
    });

    it('declines an invitation', async () => {
      const respondInput = {
        invitationId: 1,
        status: InvitationStatus.DECLINED,
      };

      const mockInvitation = {
        id: 1,
        hangoutId: 1,
        inviteeId: mockUserId,
        inviterId: 2,
        status: InvitationStatus.PENDING,
        respondedAt: null,
      };

      const respondManager = (service as any).respondManager;
      respondManager.findOne.mockResolvedValue(mockInvitation);
      respondManager.save.mockResolvedValue({
        ...mockInvitation,
        status: InvitationStatus.DECLINED,
      });

      const result = await service.respondToInvitation(
        respondInput,
        mockUserId,
      );

      expect(result.status).toBe(InvitationStatus.DECLINED);
    });

    it('responds with maybe to an invitation', async () => {
      const respondInput = {
        invitationId: 1,
        status: InvitationStatus.MAYBE,
      };

      const mockInvitation = {
        id: 1,
        hangoutId: 1,
        inviteeId: mockUserId,
        inviterId: 2,
        status: InvitationStatus.PENDING,
        respondedAt: null,
      };

      const respondManager = (service as any).respondManager;
      respondManager.findOne.mockResolvedValue(mockInvitation);
      respondManager.save.mockResolvedValue({
        ...mockInvitation,
        status: InvitationStatus.MAYBE,
      });

      const result = await service.respondToInvitation(
        respondInput,
        mockUserId,
      );

      expect(result.status).toBe(InvitationStatus.MAYBE);
    });

    it('throws error when invitation not found', async () => {
      const respondInput = {
        invitationId: 999,
        status: InvitationStatus.ACCEPTED,
      };

      const respondManager = (service as any).respondManager;
      respondManager.findOne.mockResolvedValue(null);

      await expect(
        service.respondToInvitation(respondInput, mockUserId),
      ).rejects.toThrow('Invitation not found');
    });

    it('throws HangoutUnauthorizedError when user is not the invitee', async () => {
      const respondInput = {
        invitationId: 1,
        status: InvitationStatus.ACCEPTED,
      };

      const mockInvitation = {
        id: 1,
        hangoutId: 1,
        inviteeId: 999, // Different invitee
        inviterId: 2,
        status: InvitationStatus.PENDING,
      };

      const respondManager = (service as any).respondManager;
      respondManager.findOne.mockResolvedValue(mockInvitation);

      await expect(
        service.respondToInvitation(respondInput, mockUserId),
      ).rejects.toThrow('Not authorized to respond to this invitation');
    });

    it('throws error when trying to set status to pending', async () => {
      const respondInput = {
        invitationId: 1,
        status: InvitationStatus.PENDING,
      };

      const mockInvitation = {
        id: 1,
        hangoutId: 1,
        inviteeId: mockUserId,
        inviterId: 2,
        status: InvitationStatus.PENDING,
      };

      const respondManager = (service as any).respondManager;
      respondManager.findOne.mockResolvedValue(mockInvitation);

      await expect(
        service.respondToInvitation(respondInput, mockUserId),
      ).rejects.toThrow('Cannot set invitation status to pending');
    });

    it('records respondedAt timestamp', async () => {
      const respondInput = {
        invitationId: 1,
        status: InvitationStatus.ACCEPTED,
      };

      const mockInvitation = {
        id: 1,
        hangoutId: 1,
        inviteeId: mockUserId,
        inviterId: 2,
        status: InvitationStatus.PENDING,
        respondedAt: null,
      };

      const respondManager = (service as any).respondManager;
      respondManager.findOne.mockResolvedValue(mockInvitation);
      respondManager.save.mockImplementation((entity, data) => {
        expect(data.respondedAt).toBeInstanceOf(Date);
        return Promise.resolve(data);
      });

      await service.respondToInvitation(respondInput, mockUserId);

      expect(respondManager.save).toHaveBeenCalled();
    });
  });

  describe('getInvitations', () => {
    let mockQueryBuilder: any;
    let mockCountQuery: any;

    beforeEach(() => {
      mockQueryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };

      mockCountQuery = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn(),
      };

      invitationRepository.createQueryBuilder.mockImplementation(
        () => mockQueryBuilder,
      );
    });

    it('returns invitations where user is the invitee', async () => {
      const mockInvitations = [
        {
          id: 1,
          hangoutId: 1,
          inviteeId: mockUserId,
          inviterId: 2,
          status: InvitationStatus.PENDING,
          createdAt: new Date('2024-01-01'),
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockInvitations);
      mockCountQuery.getCount.mockResolvedValue(1);

      // Mock the second createQueryBuilder call for count
      invitationRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder)
        .mockReturnValueOnce(mockCountQuery);

      const result = await service.getInvitations({}, mockUserId);

      expect(result.edges).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(invitation.invitee_id = :requestingUserId OR invitation.inviter_id = :requestingUserId OR hangout.user_id = :requestingUserId)',
        { requestingUserId: mockUserId },
      );
    });

    it('returns invitations where user is the inviter', async () => {
      const mockInvitations = [
        {
          id: 1,
          hangoutId: 1,
          inviteeId: 2,
          inviterId: mockUserId,
          status: InvitationStatus.PENDING,
          createdAt: new Date('2024-01-01'),
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockInvitations);
      mockCountQuery.getCount.mockResolvedValue(1);

      invitationRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder)
        .mockReturnValueOnce(mockCountQuery);

      const result = await service.getInvitations({}, mockUserId);

      expect(result.edges).toHaveLength(1);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(invitation.invitee_id = :requestingUserId OR invitation.inviter_id = :requestingUserId OR hangout.user_id = :requestingUserId)',
        { requestingUserId: mockUserId },
      );
    });

    it('applies hangoutId filter', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockCountQuery.getCount.mockResolvedValue(0);

      invitationRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder)
        .mockReturnValueOnce(mockCountQuery);

      await service.getInvitations({ hangoutId: 5 }, mockUserId);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'invitation.hangout_id = :hangoutId',
        { hangoutId: 5 },
      );
    });

    it('applies inviteeId filter', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockCountQuery.getCount.mockResolvedValue(0);

      invitationRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder)
        .mockReturnValueOnce(mockCountQuery);

      await service.getInvitations({ inviteeId: 3 }, mockUserId);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'invitation.invitee_id = :inviteeId',
        { inviteeId: 3 },
      );
    });

    it('applies status filter', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockCountQuery.getCount.mockResolvedValue(0);

      invitationRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder)
        .mockReturnValueOnce(mockCountQuery);

      await service.getInvitations(
        { status: InvitationStatus.ACCEPTED },
        mockUserId,
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'invitation.status = :status',
        { status: InvitationStatus.ACCEPTED },
      );
    });

    it('respects pagination limits', async () => {
      const mockInvitations = Array(25).fill({
        id: 1,
        hangoutId: 1,
        inviteeId: mockUserId,
        inviterId: 2,
        status: InvitationStatus.PENDING,
        createdAt: new Date('2024-01-01'),
      });

      mockQueryBuilder.getMany.mockResolvedValue(mockInvitations);
      mockCountQuery.getCount.mockResolvedValue(25);

      invitationRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder)
        .mockReturnValueOnce(mockCountQuery);

      await service.getInvitations({ first: 20 }, mockUserId);

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(21); // +1 for hasNextPage detection
    });

    it('limits page size to maximum of 100', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockCountQuery.getCount.mockResolvedValue(0);

      invitationRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder)
        .mockReturnValueOnce(mockCountQuery);

      await service.getInvitations({ first: 500 }, mockUserId);

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(101); // max 100 + 1
    });

    it('handles cursor pagination', async () => {
      const cursor = Buffer.from('2024-01-01T00:00:00.000Z').toString('base64');

      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockCountQuery.getCount.mockResolvedValue(0);

      invitationRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder)
        .mockReturnValueOnce(mockCountQuery);

      await service.getInvitations({ after: cursor }, mockUserId);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'invitation.created_at > :afterDate',
        { afterDate: new Date('2024-01-01T00:00:00.000Z') },
      );
    });

    it('throws error for invalid cursor', async () => {
      const invalidCursor = 'invalid-base64';

      await expect(
        service.getInvitations({ after: invalidCursor }, mockUserId),
      ).rejects.toThrow('Invalid after cursor');
    });

    it('calculates hasNextPage correctly when more results exist', async () => {
      const mockInvitations = Array(21)
        .fill(null)
        .map((_, i) => ({
          id: i + 1,
          hangoutId: 1,
          inviteeId: mockUserId,
          inviterId: 2,
          status: InvitationStatus.PENDING,
          createdAt: new Date('2024-01-01'),
        }));

      mockQueryBuilder.getMany.mockResolvedValue(mockInvitations);
      mockCountQuery.getCount.mockResolvedValue(30);

      invitationRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder)
        .mockReturnValueOnce(mockCountQuery);

      const result = await service.getInvitations({ first: 20 }, mockUserId);

      expect(result.edges).toHaveLength(20); // Should remove extra item
      expect(result.pageInfo.hasNextPage).toBe(true);
    });

    it('sets hasNextPage to false when no more results', async () => {
      const mockInvitations = [
        {
          id: 1,
          hangoutId: 1,
          inviteeId: mockUserId,
          inviterId: 2,
          status: InvitationStatus.PENDING,
          createdAt: new Date('2024-01-01'),
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockInvitations);
      mockCountQuery.getCount.mockResolvedValue(1);

      invitationRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder)
        .mockReturnValueOnce(mockCountQuery);

      const result = await service.getInvitations({ first: 20 }, mockUserId);

      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it('generates proper cursors for edges', async () => {
      const createdAt = new Date('2024-01-01T12:00:00.000Z');
      const mockInvitations = [
        {
          id: 1,
          hangoutId: 1,
          inviteeId: mockUserId,
          inviterId: 2,
          status: InvitationStatus.PENDING,
          createdAt,
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockInvitations);
      mockCountQuery.getCount.mockResolvedValue(1);

      invitationRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder)
        .mockReturnValueOnce(mockCountQuery);

      const result = await service.getInvitations({}, mockUserId);

      const expectedCursor = Buffer.from(createdAt.toISOString()).toString(
        'base64',
      );
      expect(result.edges[0].cursor).toBe(expectedCursor);
      expect(result.pageInfo.startCursor).toBe(expectedCursor);
      expect(result.pageInfo.endCursor).toBe(expectedCursor);
    });

    it('applies authorization filter to count query', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockCountQuery.getCount.mockResolvedValue(0);

      invitationRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder)
        .mockReturnValueOnce(mockCountQuery);

      await service.getInvitations({}, mockUserId);

      expect(mockCountQuery.where).toHaveBeenCalledWith(
        '(invitation.invitee_id = :requestingUserId OR invitation.inviter_id = :requestingUserId OR hangout.user_id = :requestingUserId)',
        { requestingUserId: mockUserId },
      );
    });
  });
});
