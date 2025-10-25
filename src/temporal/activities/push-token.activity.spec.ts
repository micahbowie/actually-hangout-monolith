import {
  updatePushTokenActivity,
  setUsersServiceForPushToken,
} from './push-token.activity';
import { UsersService } from '../../users/users.service';

describe('Push Token Activity', () => {
  let mockUsersService: jest.Mocked<UsersService>;

  beforeEach(() => {
    // Create mock UsersService
    mockUsersService = {
      updatePushToken: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    // Inject mock service
    setUsersServiceForPushToken(mockUsersService);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('updatePushTokenActivity', () => {
    it('successfully updates push token', async () => {
      const input = {
        userId: 'user_123',
        pushToken: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
      };

      mockUsersService.updatePushToken.mockResolvedValue(true);

      const result = await updatePushTokenActivity(input);

      expect(result).toBe(true);
      expect(mockUsersService.updatePushToken).toHaveBeenCalledWith(
        'user_123',
        'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
      );
      expect(mockUsersService.updatePushToken).toHaveBeenCalledTimes(1);
    });

    it('returns false when service returns false', async () => {
      const input = {
        userId: 'user_123',
        pushToken: 'invalid_token',
      };

      mockUsersService.updatePushToken.mockResolvedValue(false);

      const result = await updatePushTokenActivity(input);

      expect(result).toBe(false);
      expect(mockUsersService.updatePushToken).toHaveBeenCalledWith(
        'user_123',
        'invalid_token',
      );
    });

    it('returns false when userId is missing', async () => {
      const input = {
        userId: '',
        pushToken: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
      };

      const result = await updatePushTokenActivity(input);

      expect(result).toBe(false);
      expect(mockUsersService.updatePushToken).not.toHaveBeenCalled();
    });

    it('returns false when pushToken is missing', async () => {
      const input = {
        userId: 'user_123',
        pushToken: '',
      };

      const result = await updatePushTokenActivity(input);

      expect(result).toBe(false);
      expect(mockUsersService.updatePushToken).not.toHaveBeenCalled();
    });

    it('throws error when service throws error', async () => {
      const input = {
        userId: 'user_123',
        pushToken: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
      };

      const error = new Error('Database connection failed');
      mockUsersService.updatePushToken.mockRejectedValue(error);

      await expect(updatePushTokenActivity(input)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockUsersService.updatePushToken).toHaveBeenCalledWith(
        'user_123',
        'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
      );
    });

    it('is idempotent when called multiple times with same token', async () => {
      const input = {
        userId: 'user_123',
        pushToken: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
      };

      mockUsersService.updatePushToken.mockResolvedValue(true);

      // Call multiple times
      const result1 = await updatePushTokenActivity(input);
      const result2 = await updatePushTokenActivity(input);
      const result3 = await updatePushTokenActivity(input);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
      expect(mockUsersService.updatePushToken).toHaveBeenCalledTimes(3);
    });

    it('handles different push token formats', async () => {
      const inputs = [
        {
          userId: 'user_123',
          pushToken: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
        },
        {
          userId: 'user_123',
          pushToken: 'fcm_token_xyz123',
        },
        {
          userId: 'user_123',
          pushToken: 'apns_token_abc456',
        },
      ];

      mockUsersService.updatePushToken.mockResolvedValue(true);

      for (const input of inputs) {
        const result = await updatePushTokenActivity(input);
        expect(result).toBe(true);
      }

      expect(mockUsersService.updatePushToken).toHaveBeenCalledTimes(3);
    });
  });

  describe('setUsersServiceForPushToken', () => {
    it('throws error when service is not initialized', async () => {
      // Reset service to undefined
      setUsersServiceForPushToken(undefined as unknown as UsersService);

      const input = {
        userId: 'user_123',
        pushToken: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
      };

      await expect(updatePushTokenActivity(input)).rejects.toThrow(
        'UsersService not initialized in activity context',
      );

      // Restore service for other tests
      setUsersServiceForPushToken(mockUsersService);
    });
  });
});
