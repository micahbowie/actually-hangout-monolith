import { Test, TestingModule } from '@nestjs/testing';
import { HelloResolver } from './hello.resolver';
import { TemporalService } from '../temporal/temporal.service';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

describe('HelloResolver', () => {
  let resolver: HelloResolver;
  let temporalService: jest.Mocked<TemporalService>;

  beforeEach(async () => {
    const mockTemporalService = {
      getClient: jest.fn(),
      isHealthy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HelloResolver,
        {
          provide: TemporalService,
          useValue: mockTemporalService,
        },
      ],
    }).compile();

    resolver = module.get<HelloResolver>(HelloResolver);
    temporalService = module.get(TemporalService);
  });

  it('is defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('getHello', () => {
    it('returns Hello object with message from workflow', async () => {
      // Mock workflow handle
      const mockHandle = {
        result: jest
          .fn()
          .mockResolvedValue(
            'Hello World from Temporal! Name: GraphQL Query (anonymous)',
          ),
        cancel: jest.fn(),
      };

      const mockClient = {
        workflow: {
          start: jest.fn().mockResolvedValue(mockHandle),
        },
      };

      temporalService.getClient.mockResolvedValue(mockClient as never);

      const result = await resolver.getHello();

      expect(result.message).toBe(
        'Hello World from Temporal! Name: GraphQL Query (anonymous)',
      );
    });

    it('returns fallback message on workflow failure', async () => {
      temporalService.getClient.mockRejectedValue(
        new Error('Temporal connection failed'),
      );

      const result = await resolver.getHello();

      expect(result.message).toBe(
        'Hello World! (Workflow failed, returning fallback)',
      );
    });

    it('returns fallback message on workflow timeout', async () => {
      jest.useFakeTimers();

      const mockHandle = {
        result: jest
          .fn()
          .mockImplementation(
            () => new Promise((resolve) => setTimeout(resolve, 20000)),
          ),
        cancel: jest.fn(),
      };

      const mockClient = {
        workflow: {
          start: jest.fn().mockResolvedValue(mockHandle),
        },
      };

      temporalService.getClient.mockResolvedValue(mockClient as never);

      const resultPromise = resolver.getHello();

      // Fast-forward time to trigger timeout
      await jest.advanceTimersByTimeAsync(15000);

      const result = await resultPromise;

      expect(result.message).toBe(
        'Hello World! (Workflow timed out, returning fallback)',
      );

      expect(mockHandle.cancel).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });
});
