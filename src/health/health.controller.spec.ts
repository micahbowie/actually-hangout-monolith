import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import {
  HealthCheckService,
  HealthCheckResult,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: jest.Mocked<HealthCheckService>;
  let typeOrmHealthIndicator: jest.Mocked<TypeOrmHealthIndicator>;

  const mockHealthCheckResult: HealthCheckResult = {
    status: 'ok',
    info: {
      database: {
        status: 'up',
      },
    },
    error: {},
    details: {
      database: {
        status: 'up',
      },
    },
  };

  beforeEach(async () => {
    const mockHealthCheckService = {
      check: jest.fn(),
    };

    const mockTypeOrmHealthIndicator = {
      pingCheck: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: mockHealthCheckService,
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: mockTypeOrmHealthIndicator,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get(HealthCheckService);
    typeOrmHealthIndicator = module.get(TypeOrmHealthIndicator);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return health check result when database is healthy', async () => {
      // Arrange
      const mockDatabaseCheck = jest.fn().mockResolvedValue({
        database: { status: 'up' },
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      typeOrmHealthIndicator.pingCheck.mockReturnValue(mockDatabaseCheck());
      healthCheckService.check.mockResolvedValue(mockHealthCheckResult);

      // Act
      const result = await controller.check();

      // Assert
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(healthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function),
      ]);
      expect(result).toEqual(mockHealthCheckResult);
      expect(result.status).toBe('ok');
      expect(result.details.database.status).toBe('up');
    });

    it('should handle database connection failure', async () => {
      // Arrange
      const mockErrorResult: HealthCheckResult = {
        status: 'error',
        info: {},
        error: {
          database: {
            status: 'down',
            message: 'Connection failed',
          },
        },
        details: {
          database: {
            status: 'down',
            message: 'Connection failed',
          },
        },
      };

      healthCheckService.check.mockResolvedValue(mockErrorResult);

      // Act
      const result = await controller.check();

      // Assert
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(healthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function),
      ]);
      expect(result).toEqual(mockErrorResult);
      expect(result.status).toBe('error');
      expect(result.details.database.status).toBe('down');
    });

    it('should call TypeOrmHealthIndicator.pingCheck with correct parameters', async () => {
      // Arrange
      const mockDatabaseCheck = jest.fn().mockResolvedValue({
        database: { status: 'up' },
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      typeOrmHealthIndicator.pingCheck.mockReturnValue(mockDatabaseCheck());
      healthCheckService.check.mockResolvedValue(mockHealthCheckResult);

      // Act
      await controller.check();

      // Assert
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(healthCheckService.check).toHaveBeenCalledTimes(1);
      const checkFunction = healthCheckService.check.mock.calls[0][0][0];

      // Execute the function passed to health.check to verify it calls pingCheck
      await checkFunction();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(typeOrmHealthIndicator.pingCheck).toHaveBeenCalledWith('database');
    });
  });

  describe('ping', () => {
    it('should return status ok with timestamp', () => {
      // Arrange
      const beforeCall = new Date();

      // Act
      const result = controller.ping();

      // Assert
      const afterCall = new Date();
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');

      const timestamp = new Date(result.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });

    it('should return valid ISO timestamp format', () => {
      // Act
      const result = controller.ping();

      // Assert
      expect(result.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it('should return different timestamps on subsequent calls', async () => {
      // Act
      const result1 = controller.ping();

      // Wait a small amount to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 1));

      const result2 = controller.ping();

      // Assert
      expect(result1.timestamp).not.toBe(result2.timestamp);
      expect(new Date(result1.timestamp).getTime()).toBeLessThan(
        new Date(result2.timestamp).getTime(),
      );
    });
  });
});
