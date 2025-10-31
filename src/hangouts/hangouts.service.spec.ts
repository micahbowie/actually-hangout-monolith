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
import { CreateHangoutInput } from './dto/create-hangout.input';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
describe('HangoutsService', () => {
  let service: HangoutsService;
  let hangoutRepository: jest.Mocked<Repository<Hangout>>;
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
      ],
    }).compile();

    service = module.get<HangoutsService>(HangoutsService);
    hangoutRepository = module.get(getRepositoryToken(Hangout));
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
});
