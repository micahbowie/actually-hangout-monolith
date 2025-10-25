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
});
