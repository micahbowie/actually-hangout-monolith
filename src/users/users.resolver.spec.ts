import { Test, TestingModule } from '@nestjs/testing';
import { UsersResolver } from './users.resolver';
import { TemporalService } from '../temporal/temporal.service';
import { AuthObject } from '../auth/types/auth.types';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

describe('UsersResolver', () => {
  let resolver: UsersResolver;
  let temporalService: jest.Mocked<TemporalService>;

  const mockAuth: AuthObject = {
    userId: 'user_123abc',
    sessionId: 'sess_123',
    orgId: undefined,
  };

  const mockWorkflowClient = {
    workflow: {
      start: jest.fn(),
    },
  };

  beforeEach(async () => {
    const mockTemporalService = {
      getClient: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersResolver,
        {
          provide: TemporalService,
          useValue: mockTemporalService,
        },
      ],
    }).compile();

    resolver = module.get<UsersResolver>(UsersResolver);
    temporalService = module.get(TemporalService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('updateUserPushToken', () => {
    it('successfully starts workflow and returns true', async () => {
      const input = { token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' };

      temporalService.getClient.mockResolvedValue(mockWorkflowClient as never);
      mockWorkflowClient.workflow.start.mockResolvedValue({} as never);

      const result = await resolver.updateUserPushToken(mockAuth, input);

      expect(result).toBe(true);
      expect(temporalService.getClient).toHaveBeenCalled();
      expect(mockWorkflowClient.workflow.start).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          args: [
            {
              userId: 'user_123abc',
              pushToken: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
            },
          ],
          taskQueue: 'actually-core-logic',
          workflowExecutionTimeout: '1m',
        }),
      );
    });

    it('throws error when Temporal client fails', async () => {
      const input = { token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' };
      const error = new Error('Temporal connection failed');

      temporalService.getClient.mockRejectedValue(error);

      await expect(
        resolver.updateUserPushToken(mockAuth, input),
      ).rejects.toThrow(
        'Failed to update push token: Temporal connection failed',
      );

      expect(temporalService.getClient).toHaveBeenCalled();
      expect(mockWorkflowClient.workflow.start).not.toHaveBeenCalled();
    });

    it('throws error when workflow fails to start', async () => {
      const input = { token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' };
      const error = new Error('Workflow start failed');

      temporalService.getClient.mockResolvedValue(mockWorkflowClient as never);
      mockWorkflowClient.workflow.start.mockRejectedValue(error);

      await expect(
        resolver.updateUserPushToken(mockAuth, input),
      ).rejects.toThrow('Failed to update push token: Workflow start failed');

      expect(temporalService.getClient).toHaveBeenCalled();
      expect(mockWorkflowClient.workflow.start).toHaveBeenCalled();
    });

    it('includes workflow ID in started workflow', async () => {
      const input = { token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' };

      temporalService.getClient.mockResolvedValue(mockWorkflowClient as never);
      mockWorkflowClient.workflow.start.mockResolvedValue({} as never);

      await resolver.updateUserPushToken(mockAuth, input);

      expect(mockWorkflowClient.workflow.start).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          workflowId: expect.stringMatching(/^update-push-token-user_123abc-/),
        }),
      );
    });

    it('handles different token formats', async () => {
      const tokens = [
        'ExponentPushToken[abcd1234]',
        'fcm_token_xyz123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567',
        'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890',
      ];

      temporalService.getClient.mockResolvedValue(mockWorkflowClient as never);
      mockWorkflowClient.workflow.start.mockResolvedValue({} as never);

      for (const token of tokens) {
        const result = await resolver.updateUserPushToken(mockAuth, { token });
        expect(result).toBe(true);
      }

      expect(mockWorkflowClient.workflow.start).toHaveBeenCalledTimes(3);
    });

    it('calls workflow for each push token update', async () => {
      const input = { token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' };

      temporalService.getClient.mockResolvedValue(mockWorkflowClient as never);
      mockWorkflowClient.workflow.start.mockResolvedValue({} as never);

      await resolver.updateUserPushToken(mockAuth, input);
      await resolver.updateUserPushToken(mockAuth, input);

      expect(mockWorkflowClient.workflow.start).toHaveBeenCalledTimes(2);
    });
  });
});
