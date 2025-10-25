import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User, UserMood } from './entities/user.entity';
import { ClerkUserData } from './types/clerk-webhook.types';
import { NotFoundException } from '@nestjs/common';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

// Mock phone
jest.mock('phone', () => ({
  phone: jest.fn((phoneNumber: string) => ({
    isValid: phoneNumber === '+15551234567',
    phoneNumber: phoneNumber,
  })),
}));

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<User>>;
  let mockManager: any;

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

  const mockClerkUserData: ClerkUserData = {
    id: 'user_123abc',
    first_name: 'John',
    last_name: 'Doe',
    email_addresses: [
      {
        id: 'email_123',
        email_address: 'john@example.com',
        verification: { status: 'verified' },
      },
    ],
    primary_email_address_id: 'email_123',
    phone_numbers: [
      {
        id: 'phone_123',
        phone_number: '+15551234567',
        verification: { status: 'verified' },
      },
    ],
    primary_phone_number_id: 'phone_123',
    image_url: 'https://example.com/image.jpg',
    profile_image_url: 'https://example.com/image.jpg',
    username: 'johndoe',
    birthday: null,
    created_at: 1704067200,
    updated_at: 1704067200,
    last_sign_in_at: 1704067200,
    two_factor_enabled: false,
    password_enabled: true,
    external_id: null,
    gender: null,
    object: 'user',
    primary_web3_wallet_id: null,
    private_metadata: {},
    public_metadata: {},
    unsafe_metadata: {},
    external_accounts: [],
    web3_wallets: [],
  };

  beforeEach(async () => {
    // Mock EntityManager for transactions
    mockManager = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      manager: {
        transaction: jest.fn(async (callback) => {
          // Execute the transaction callback with the mock manager
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
          return await callback(mockManager);
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a new user with valid Clerk data', async () => {
      repository.create.mockReturnValue(mockUser);
      repository.save.mockResolvedValue(mockUser);

      const result = await service.createUser(mockClerkUserData);

      expect(result).toEqual(mockUser);
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledWith(mockUser);
    });

    it('should throw error when primary phone number is missing', async () => {
      const invalidData = {
        ...mockClerkUserData,
        phone_numbers: [],
      };

      await expect(service.createUser(invalidData)).rejects.toThrow(
        'Primary phone number not found',
      );
    });

    it('should throw error when phone number is invalid', async () => {
      const invalidData = {
        ...mockClerkUserData,
        phone_numbers: [
          {
            id: 'phone_123',
            phone_number: 'invalid',
          },
        ],
      };

      await expect(service.createUser(invalidData)).rejects.toThrow(
        'Invalid phone number',
      );
    });

    it('should handle user with no primary email', async () => {
      const dataWithoutEmail = {
        ...mockClerkUserData,
        email_addresses: [],
        primary_email_address_id: null,
      };

      repository.create.mockReturnValue({ ...mockUser, email: null });
      repository.save.mockResolvedValue({ ...mockUser, email: null });

      const result = await service.createUser(dataWithoutEmail);

      expect(result.email).toBeNull();
    });

    it('should extract mood from unsafe_metadata', async () => {
      const dataWithMood = {
        ...mockClerkUserData,
        unsafe_metadata: {
          mood: 'going_out',
        },
      };

      const userWithMood = { ...mockUser, mood: UserMood.GOING_OUT };
      repository.create.mockReturnValue(userWithMood);
      repository.save.mockResolvedValue(userWithMood);

      const result = await service.createUser(dataWithMood);

      expect(result.mood).toBe(UserMood.GOING_OUT);
    });
  });

  describe('updateUser', () => {
    it('should update an existing user', async () => {
      const updates = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const updatedUser = { ...mockUser, ...updates };
      repository.findOne.mockResolvedValue(mockUser);
      repository.save.mockResolvedValue(updatedUser);

      const result = await service.updateUser('user_123abc', updates);

      expect(result).toEqual(updatedUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { clerkId: 'user_123abc' },
      });
    });

    it('should return null when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.updateUser('user_nonexistent', {
        firstName: 'Test',
      });

      expect(result).toBeNull();
    });

    it('should update lastSignInAt from timestamp', async () => {
      const timestamp = 1704067200;
      repository.findOne.mockResolvedValue(mockUser);
      repository.save.mockResolvedValue(mockUser);

      await service.updateUser('user_123abc', {
        lastSignInAt: timestamp,
      });

      expect(repository.save).toHaveBeenCalled();
    });

    it('should update mood when valid', async () => {
      repository.findOne.mockResolvedValue(mockUser);
      repository.save.mockResolvedValue(mockUser);

      await service.updateUser('user_123abc', {
        mood: 'going_online',
      });

      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should delete an existing user', async () => {
      repository.findOne.mockResolvedValue(mockUser);
      repository.remove.mockResolvedValue(mockUser);

      await service.deleteUser('user_123abc');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { clerkId: 'user_123abc' },
      });
      expect(repository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.deleteUser('user_nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserByClerkId', () => {
    it('should find a user by Clerk ID', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.getUserByClerkId('user_123abc');

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { clerkId: 'user_123abc' },
      });
    });

    it('should return null when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.getUserByClerkId('user_nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getUserByUuid', () => {
    it('should find a user by UUID', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.getUserByUuid(mockUser.uuid);

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { uuid: mockUser.uuid },
      });
    });

    it('should return null when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.getUserByUuid('nonexistent-uuid');

      expect(result).toBeNull();
    });
  });

  /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
  describe('updatePushToken', () => {
    it('adds a new push token to an empty tokens array', async () => {
      const pushToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';
      mockManager.findOne.mockResolvedValue(mockUser);
      mockManager.save.mockResolvedValue({
        ...mockUser,
        pushTokens: [pushToken],
      });

      const result = await service.updatePushToken('user_123abc', pushToken);

      expect(result).toBe(true);
      expect(mockManager.findOne).toHaveBeenCalledWith(User, {
        where: { clerkId: 'user_123abc' },
        lock: { mode: 'pessimistic_write' },
      });
      expect(mockManager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          pushTokens: [pushToken],
        }),
      );
    });

    it('adds a new push token to existing tokens', async () => {
      const existingToken = 'ExponentPushToken[existing]';
      const newToken = 'ExponentPushToken[new]';
      const userWithToken = {
        ...mockUser,
        pushTokens: [existingToken],
      };

      mockManager.findOne.mockResolvedValue(userWithToken);
      mockManager.save.mockResolvedValue({
        ...userWithToken,
        pushTokens: [existingToken, newToken],
      });

      const result = await service.updatePushToken('user_123abc', newToken);

      expect(result).toBe(true);
      expect(mockManager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          pushTokens: [existingToken, newToken],
        }),
      );
    });

    it('returns true without saving when token already exists (idempotent)', async () => {
      const existingToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';
      const userWithToken = {
        ...mockUser,
        pushTokens: [existingToken],
      };

      mockManager.findOne.mockResolvedValue(userWithToken);

      const result = await service.updatePushToken(
        'user_123abc',
        existingToken,
      );

      expect(result).toBe(true);
      expect(mockManager.findOne).toHaveBeenCalledWith(User, {
        where: { clerkId: 'user_123abc' },
        lock: { mode: 'pessimistic_write' },
      });
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('returns false when push token is too short', async () => {
      const shortToken = 'short';

      const result = await service.updatePushToken('user_123abc', shortToken);

      expect(result).toBe(false);
      expect(repository.findOne).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('returns false when push token is empty', async () => {
      const result = await service.updatePushToken('user_123abc', '');

      expect(result).toBe(false);
      expect(repository.findOne).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('returns false when user is not found', async () => {
      const pushToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';
      mockManager.findOne.mockResolvedValue(null);

      const result = await service.updatePushToken(
        'nonexistent_clerk_id',
        pushToken,
      );

      expect(result).toBe(false);
      expect(mockManager.findOne).toHaveBeenCalledWith(User, {
        where: { clerkId: 'nonexistent_clerk_id' },
        lock: { mode: 'pessimistic_write' },
      });
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('updates the updatedAt timestamp when adding a new token', async () => {
      const pushToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';
      const originalUpdatedAt = new Date('2024-01-01');
      const userWithOldTimestamp = {
        ...mockUser,
        updatedAt: originalUpdatedAt,
        pushTokens: [], // Empty array so token will be added
      };

      mockManager.findOne.mockResolvedValue(userWithOldTimestamp);
      mockManager.save.mockImplementation((user: User) =>
        Promise.resolve(user),
      );

      await service.updatePushToken('user_123abc', pushToken);

      expect(mockManager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          updatedAt: expect.any(Date),
        }),
      );

      const savedUser = mockManager.save.mock.calls[0][0] as User;
      expect(savedUser.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });

    it('returns false when token format is unknown', async () => {
      const invalidToken = 'unknown_format_token_1234567890';

      const result = await service.updatePushToken('user_123abc', invalidToken);

      expect(result).toBe(false);
      expect(repository.findOne).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('returns false when maximum tokens limit is reached', async () => {
      const pushToken = 'ExponentPushToken[new_token]';
      const userWithMaxTokens = {
        ...mockUser,
        pushTokens: Array(10).fill('ExponentPushToken[existing]'),
      };

      mockManager.findOne.mockResolvedValue(userWithMaxTokens);

      const result = await service.updatePushToken('user_123abc', pushToken);

      expect(result).toBe(false);
      expect(mockManager.findOne).toHaveBeenCalled();
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('accepts FCM token format', async () => {
      const fcmToken = 'a'.repeat(152);
      mockManager.findOne.mockResolvedValue(mockUser);
      mockManager.save.mockResolvedValue({
        ...mockUser,
        pushTokens: [fcmToken],
      });

      const result = await service.updatePushToken('user_123abc', fcmToken);

      expect(result).toBe(true);
      expect(mockManager.save).toHaveBeenCalled();
    });

    it('accepts APNs token format', async () => {
      const apnsToken = 'a1b2c3d4e5f67890'.repeat(4);
      mockManager.findOne.mockResolvedValue(mockUser);
      mockManager.save.mockResolvedValue({
        ...mockUser,
        pushTokens: [apnsToken],
      });

      const result = await service.updatePushToken('user_123abc', apnsToken);

      expect(result).toBe(true);
      expect(mockManager.save).toHaveBeenCalled();
    });
  });
  /* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
});
