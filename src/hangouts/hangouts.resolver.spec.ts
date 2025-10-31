import { Test, TestingModule } from '@nestjs/testing';
import { HangoutsResolver } from './hangouts.resolver';
import { HangoutsService } from './hangouts.service';
import { UsersService } from '../users/users.service';
import {
  Hangout,
  HangoutVisibility,
  HangoutStatus,
} from './entities/hangout.entity';
import { User, UserMood } from '../users/entities/user.entity';
import { CreateHangoutInput } from './dto/create-hangout.input';
import type { AuthObject } from '../auth/types/auth.types';
import {
  HangoutNotFoundError,
  HangoutUnauthorizedError,
} from './errors/hangout.errors';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
describe('HangoutsResolver', () => {
  let resolver: HangoutsResolver;
  let hangoutsService: jest.Mocked<HangoutsService>;
  let usersService: jest.Mocked<UsersService>;

  const mockAuth: AuthObject = {
    userId: 'user_123abc',
  };

  const mockUser: User = {
    id: 1,
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    clerkId: 'user_123abc',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phoneNumber: '+15551234567',
    profileImageUrl: 'https://example.com/image.jpg',
    bannerImageUrl: null,
    username: 'johndoe',
    birthday: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastSignInAt: new Date('2024-01-01'),
    pushTokens: [],
    mood: UserMood.ANTI_SOCIAL,
  };

  const mockHangout: Hangout = {
    id: 1,
    uuid: 'hangout-uuid-1234',
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
    userId: 1,
    user: null as any,
    suggestions: [],
    collaborators: [],
    creator: '1',
    createdBy: '1',
    location: null,
    activity: null,
    date: null,
    locationDetails: null,
    groupDecisionSettings: null,
  };

  beforeEach(async () => {
    const mockHangoutsService = {
      createHangout: jest.fn(),
      getHangoutById: jest.fn(),
      getHangoutByUuid: jest.fn(),
      getCollaborators: jest.fn(),
    };

    const mockUsersService = {
      getUserByClerkId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HangoutsResolver,
        {
          provide: HangoutsService,
          useValue: mockHangoutsService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    resolver = module.get<HangoutsResolver>(HangoutsResolver);
    hangoutsService = module.get(HangoutsService);
    usersService = module.get(UsersService);
  });

  it('is defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createHangout', () => {
    const input: CreateHangoutInput = {
      title: 'Test Hangout',
      visibility: HangoutVisibility.PUBLIC,
      collaborationMode: false,
    };

    it('successfully creates a hangout', async () => {
      usersService.getUserByClerkId.mockResolvedValue(mockUser);
      hangoutsService.createHangout.mockResolvedValue(mockHangout);

      const result = await resolver.createHangout(mockAuth, input);

      expect(result).toEqual(mockHangout);
      expect(usersService.getUserByClerkId).toHaveBeenCalledWith('user_123abc');
      expect(hangoutsService.createHangout).toHaveBeenCalledWith(input, 1);
    });

    it('throws error when user not found', async () => {
      usersService.getUserByClerkId.mockResolvedValue(null);

      await expect(resolver.createHangout(mockAuth, input)).rejects.toThrow(
        'User not found',
      );
    });

    it('returns generic error message for database errors', async () => {
      usersService.getUserByClerkId.mockResolvedValue(mockUser);
      hangoutsService.createHangout.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(resolver.createHangout(mockAuth, input)).rejects.toThrow(
        'Failed to create hangout. Please check your input and try again.',
      );
    });

    it('passes through validation error for required fields', async () => {
      usersService.getUserByClerkId.mockResolvedValue(mockUser);
      hangoutsService.createHangout.mockRejectedValue(
        new Error('Title is required'),
      );

      await expect(resolver.createHangout(mockAuth, input)).rejects.toThrow(
        'Title is required',
      );
    });

    it('passes through validation error for invalid input', async () => {
      usersService.getUserByClerkId.mockResolvedValue(mockUser);
      hangoutsService.createHangout.mockRejectedValue(
        new Error('Invalid date format'),
      );

      await expect(resolver.createHangout(mockAuth, input)).rejects.toThrow(
        'Invalid date format',
      );
    });

    it('passes through validation error for must be constraints', async () => {
      usersService.getUserByClerkId.mockResolvedValue(mockUser);
      hangoutsService.createHangout.mockRejectedValue(
        new Error('Votes per person must be positive'),
      );

      await expect(resolver.createHangout(mockAuth, input)).rejects.toThrow(
        'Votes per person must be positive',
      );
    });

    it('passes through validation error for cannot exceed constraints', async () => {
      usersService.getUserByClerkId.mockResolvedValue(mockUser);
      hangoutsService.createHangout.mockRejectedValue(
        new Error('Title cannot exceed 255 characters'),
      );

      await expect(resolver.createHangout(mockAuth, input)).rejects.toThrow(
        'Title cannot exceed 255 characters',
      );
    });

    it('passes through validation error for deadline constraints', async () => {
      usersService.getUserByClerkId.mockResolvedValue(mockUser);
      hangoutsService.createHangout.mockRejectedValue(
        new Error('Suggestion deadline must be in the future'),
      );

      await expect(resolver.createHangout(mockAuth, input)).rejects.toThrow(
        'Suggestion deadline must be in the future',
      );
    });

    it('includes hangout details in success response', async () => {
      const detailedHangout = {
        ...mockHangout,
        description: 'Detailed description',
        locationName: 'Central Park',
      };

      usersService.getUserByClerkId.mockResolvedValue(mockUser);
      hangoutsService.createHangout.mockResolvedValue(detailedHangout);

      const result = await resolver.createHangout(mockAuth, {
        ...input,
        description: 'Detailed description',
        location: 'Central Park',
      });

      expect(result.description).toBe('Detailed description');
      expect(result.locationName).toBe('Central Park');
    });

    it('creates collaboration mode hangout', async () => {
      const collabInput: CreateHangoutInput = {
        title: 'Collaboration Hangout',
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
            suggestion: '2024-12-30T20:00:00.000Z',
            voting: '2024-12-31T20:00:00.000Z',
          },
          notifications: {
            newSuggestions: true,
            votingUpdates: true,
            deadlineReminders: true,
          },
        },
      };

      const collabHangout = {
        ...mockHangout,
        collaborationMode: true,
      };

      usersService.getUserByClerkId.mockResolvedValue(mockUser);
      hangoutsService.createHangout.mockResolvedValue(collabHangout);

      const result = await resolver.createHangout(mockAuth, collabInput);

      expect(result.collaborationMode).toBe(true);
      expect(hangoutsService.createHangout).toHaveBeenCalledWith(
        collabInput,
        1,
      );
    });
  });

  describe('getHangout', () => {
    it('returns a hangout by ID with authorization', async () => {
      usersService.getUserByClerkId.mockResolvedValue(mockUser);
      hangoutsService.getHangoutById.mockResolvedValue(mockHangout);

      const result = await resolver.getHangout(mockAuth, 1);

      expect(result).toEqual(mockHangout);
      expect(usersService.getUserByClerkId).toHaveBeenCalledWith('user_123abc');
      expect(hangoutsService.getHangoutById).toHaveBeenCalledWith(1, 1);
    });

    it('returns null when hangout not found', async () => {
      usersService.getUserByClerkId.mockResolvedValue(mockUser);
      hangoutsService.getHangoutById.mockResolvedValue(null);

      const result = await resolver.getHangout(mockAuth, 999);

      expect(result).toBeNull();
    });

    it('throws UserNotFoundError when user not found', async () => {
      usersService.getUserByClerkId.mockResolvedValue(null);

      await expect(resolver.getHangout(mockAuth, 1)).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('groupDecisionSuggestions', () => {
    it('returns null for non-collaboration hangout', async () => {
      const result = await resolver.groupDecisionSuggestions(mockHangout);

      expect(result).toBeNull();
    });

    it('returns empty arrays for collaboration hangout with no suggestions', async () => {
      const collabHangout = {
        ...mockHangout,
        collaborationMode: true,
      };

      hangoutsService.getSuggestionsByHangoutId = jest
        .fn()
        .mockResolvedValue([]);

      const result = await resolver.groupDecisionSuggestions(collabHangout);

      expect(result).toEqual({
        locations: [],
        activities: [],
        dateTimes: [],
      });
      expect(hangoutsService.getSuggestionsByHangoutId).toHaveBeenCalledWith(1);
    });

    it('returns grouped suggestions for collaboration hangout', async () => {
      const collabHangout = {
        ...mockHangout,
        collaborationMode: true,
      };

      const mockSuggestions = [
        {
          id: 1,
          uuid: 'suggestion-uuid-1',
          suggestionType: 'location',
          locationName: 'Central Park',
          locationAddress: '123 Main St',
          locationLatitude: 40.7128,
          locationLongitude: -74.006,
          activityName: null,
          suggestedStartTime: null,
          suggestedDate: null,
          notes: 'Great park',
          userId: 1,
          hangoutId: 1,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 2,
          uuid: 'suggestion-uuid-2',
          suggestionType: 'activity',
          locationName: null,
          locationAddress: null,
          locationLatitude: null,
          locationLongitude: null,
          activityName: 'Hiking',
          suggestedStartTime: null,
          suggestedDate: null,
          notes: 'Bring water',
          userId: 1,
          hangoutId: 1,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 3,
          uuid: 'suggestion-uuid-3',
          suggestionType: 'time',
          locationName: null,
          locationAddress: null,
          locationLatitude: null,
          locationLongitude: null,
          activityName: null,
          suggestedStartTime: new Date('2024-12-25T15:00:00.000Z'),
          suggestedDate: new Date('2024-12-25T15:00:00.000Z'),
          notes: null,
          userId: 1,
          hangoutId: 1,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      hangoutsService.getSuggestionsByHangoutId = jest
        .fn()
        .mockResolvedValue(mockSuggestions);

      const result = await resolver.groupDecisionSuggestions(collabHangout);

      expect(result).toEqual({
        locations: [
          {
            id: 'suggestion-uuid-1',
            location: 'Central Park',
            locationDetails: {
              coordinates: {
                latitude: 40.7128,
                longitude: -74.006,
              },
              fullAddress: '123 Main St',
              placedFormatted: 'Central Park',
            },
            note: 'Great park',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            suggestedBy: '1',
          },
        ],
        activities: [
          {
            id: 'suggestion-uuid-2',
            activity: 'Hiking',
            note: 'Bring water',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            suggestedBy: '1',
          },
        ],
        dateTimes: [
          {
            id: 'suggestion-uuid-3',
            dateTime: '2024-12-25T15:00:00.000Z',
            availabilityType: 'SPECIFIC',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            suggestedBy: '1',
          },
        ],
      });
      expect(hangoutsService.getSuggestionsByHangoutId).toHaveBeenCalledWith(1);
    });
  });

  describe('deleteHangout', () => {
    it('successfully deletes a hangout', async () => {
      usersService.getUserByClerkId.mockResolvedValue(mockUser);
      hangoutsService.deleteHangout = jest.fn().mockResolvedValue(true);

      const result = await resolver.deleteHangout(mockAuth, 1);

      expect(result).toBe(true);
      expect(usersService.getUserByClerkId).toHaveBeenCalledWith('user_123abc');
      expect(hangoutsService.deleteHangout).toHaveBeenCalledWith(1, 1);
    });

    it('throws UserNotFoundError when user not found', async () => {
      usersService.getUserByClerkId.mockResolvedValue(null);

      await expect(resolver.deleteHangout(mockAuth, 1)).rejects.toThrow(
        'User not found',
      );
    });

    it('passes through HangoutNotFoundError', async () => {
      usersService.getUserByClerkId.mockResolvedValue(mockUser);
      hangoutsService.deleteHangout = jest
        .fn()
        .mockRejectedValue(new HangoutNotFoundError('Hangout not found'));

      await expect(resolver.deleteHangout(mockAuth, 1)).rejects.toThrow(
        'Hangout not found',
      );
    });

    it('passes through HangoutUnauthorizedError', async () => {
      usersService.getUserByClerkId.mockResolvedValue(mockUser);
      hangoutsService.deleteHangout = jest
        .fn()
        .mockRejectedValue(
          new HangoutUnauthorizedError('Not authorized to delete this hangout'),
        );

      await expect(resolver.deleteHangout(mockAuth, 1)).rejects.toThrow(
        'Not authorized to delete this hangout',
      );
    });

    it('returns generic error for unexpected failures', async () => {
      usersService.getUserByClerkId.mockResolvedValue(mockUser);
      hangoutsService.deleteHangout = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      await expect(resolver.deleteHangout(mockAuth, 1)).rejects.toThrow(
        'Failed to delete hangout. Please try again.',
      );
    });
  });

  describe('getHangouts', () => {
    it('successfully retrieves hangouts', async () => {
      const mockResponse = {
        hangouts: [mockHangout],
        nextToken: undefined,
        total: 1,
      };

      usersService.getUserByClerkId.mockResolvedValue(mockUser);
      hangoutsService.getHangouts = jest.fn().mockResolvedValue(mockResponse);

      const result = await resolver.getHangouts(mockAuth);

      expect(result).toEqual(mockResponse);
      expect(usersService.getUserByClerkId).toHaveBeenCalledWith('user_123abc');
      expect(hangoutsService.getHangouts).toHaveBeenCalledWith(1, undefined);
    });

    it('retrieves hangouts with filters', async () => {
      const mockResponse = {
        hangouts: [mockHangout],
        nextToken: undefined,
        total: 1,
      };

      const input = {
        search: 'test',
        collaborationMode: true,
        limit: 10,
      };

      usersService.getUserByClerkId.mockResolvedValue(mockUser);
      hangoutsService.getHangouts = jest.fn().mockResolvedValue(mockResponse);

      const result = await resolver.getHangouts(mockAuth, input);

      expect(result).toEqual(mockResponse);
      expect(hangoutsService.getHangouts).toHaveBeenCalledWith(1, input);
    });

    it('throws error when user not found', async () => {
      usersService.getUserByClerkId.mockResolvedValue(null);

      await expect(resolver.getHangouts(mockAuth)).rejects.toThrow(
        'User not found',
      );
    });

    it('returns generic error for service failures', async () => {
      usersService.getUserByClerkId.mockResolvedValue(mockUser);
      hangoutsService.getHangouts = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      await expect(resolver.getHangouts(mockAuth)).rejects.toThrow(
        'Failed to get hangouts. Please try again.',
      );
    });
  });

  describe('collaborators', () => {
    const mockConnection = {
      edges: [
        {
          node: {
            id: 1,
            uuid: 'collab-uuid-1',
            hangoutId: 1,
            userId: 2,
            role: 'collaborator',
            invitedBy: 1,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
          cursor: 'cursor-1',
        },
      ],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: 'cursor-1',
        endCursor: 'cursor-1',
      },
      totalCount: 1,
    };

    it('returns collaborators for authorized user', async () => {
      usersService.getUserByClerkId.mockResolvedValue(mockUser);
      hangoutsService.getHangoutById = jest.fn().mockResolvedValue(mockHangout);
      hangoutsService.getCollaborators = jest
        .fn()
        .mockResolvedValue(mockConnection);

      const result = await resolver.collaborators(mockHangout, mockAuth, 20);

      expect(usersService.getUserByClerkId).toHaveBeenCalledWith(
        mockAuth.userId,
      );
      expect(hangoutsService.getHangoutById).toHaveBeenCalledWith(
        mockHangout.id,
        mockUser.id,
      );
      expect(hangoutsService.getCollaborators).toHaveBeenCalledWith(
        mockHangout.id,
        {
          first: 20,
          after: undefined,
          last: undefined,
          before: undefined,
        },
      );
      expect(result).toEqual(mockConnection);
    });

    it('passes pagination parameters correctly', async () => {
      usersService.getUserByClerkId.mockResolvedValue(mockUser);
      hangoutsService.getHangoutById = jest.fn().mockResolvedValue(mockHangout);
      hangoutsService.getCollaborators = jest
        .fn()
        .mockResolvedValue(mockConnection);

      await resolver.collaborators(
        mockHangout,
        mockAuth,
        10,
        'cursor-after',
        undefined,
        'cursor-before',
      );

      expect(hangoutsService.getCollaborators).toHaveBeenCalledWith(
        mockHangout.id,
        {
          first: 10,
          after: 'cursor-after',
          last: undefined,
          before: 'cursor-before',
        },
      );
    });

    it('throws UserNotFoundError when user not found', async () => {
      usersService.getUserByClerkId.mockResolvedValue(null);

      await expect(
        resolver.collaborators(mockHangout, mockAuth, 20),
      ).rejects.toThrow('User not found');

      expect(hangoutsService.getHangoutById).not.toHaveBeenCalled();
      expect(hangoutsService.getCollaborators).not.toHaveBeenCalled();
    });

    it('throws HangoutUnauthorizedError when user not authorized', async () => {
      usersService.getUserByClerkId.mockResolvedValue(mockUser);
      hangoutsService.getHangoutById = jest.fn().mockResolvedValue(null);

      await expect(
        resolver.collaborators(mockHangout, mockAuth, 20),
      ).rejects.toThrow('Not authorized to view this hangout');

      expect(hangoutsService.getHangoutById).toHaveBeenCalledWith(
        mockHangout.id,
        mockUser.id,
      );
      expect(hangoutsService.getCollaborators).not.toHaveBeenCalled();
    });

    it('uses default pagination value of 20', async () => {
      usersService.getUserByClerkId.mockResolvedValue(mockUser);
      hangoutsService.getHangoutById = jest.fn().mockResolvedValue(mockHangout);
      hangoutsService.getCollaborators = jest
        .fn()
        .mockResolvedValue(mockConnection);

      await resolver.collaborators(mockHangout, mockAuth);

      expect(hangoutsService.getCollaborators).toHaveBeenCalledWith(
        mockHangout.id,
        expect.objectContaining({
          first: undefined,
        }),
      );
    });

    it('authorizes based on hangout visibility rules', async () => {
      const privateHangout = {
        ...mockHangout,
        visibility: 'private' as any,
        userId: 999, // Different owner
      };

      usersService.getUserByClerkId.mockResolvedValue(mockUser);
      hangoutsService.getHangoutById = jest.fn().mockResolvedValue(null); // Not authorized

      await expect(
        resolver.collaborators(privateHangout, mockAuth, 20),
      ).rejects.toThrow('Not authorized to view this hangout');
    });
  });
});
