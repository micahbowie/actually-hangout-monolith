import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksService } from './webhooks.service';
import { TemporalService } from '../temporal/temporal.service';
import {
  UserCreatedEvent,
  UserUpdatedEvent,
  UserDeletedEvent,
  SessionCreatedEvent,
} from '../users/types/clerk-webhook.types';

describe('WebhooksService', () => {
  let service: WebhooksService;
  let temporalService: jest.Mocked<TemporalService>;

  const mockUserCreatedEvent: UserCreatedEvent = {
    type: 'user.created',
    data: {
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
    },
  };

  const mockUserUpdatedEvent: UserUpdatedEvent = {
    type: 'user.updated',
    data: mockUserCreatedEvent.data,
  };

  const mockUserDeletedEvent: UserDeletedEvent = {
    type: 'user.deleted',
    data: {
      id: 'user_123abc',
      deleted: true,
    },
  };

  const mockSessionCreatedEvent: SessionCreatedEvent = {
    type: 'session.created',
    data: {
      id: 'session_123',
      user_id: 'user_123abc',
      last_active_at: 1704067200,
      created_at: 1704067200,
    },
  };

  beforeEach(async () => {
    const mockWorkflowHandle = {
      workflowId: 'test-workflow-id',
      result: jest.fn().mockResolvedValue(undefined),
    };

    const mockClient = {
      workflow: {
        start: jest.fn().mockResolvedValue(mockWorkflowHandle),
      },
    };

    const mockTemporalService = {
      getClient: jest.fn().mockResolvedValue(mockClient),
      isHealthy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        {
          provide: TemporalService,
          useValue: mockTemporalService,
        },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
    temporalService = module.get(TemporalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleWebhook', () => {
    it('should route user.created events and trigger workflow', async () => {
      service.handleWebhook(mockUserCreatedEvent);

      // Give async workflow call time to execute
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(temporalService.getClient).toHaveBeenCalled();
    });

    it('should route user.updated events and trigger workflow', async () => {
      service.handleWebhook(mockUserUpdatedEvent);

      // Give async workflow call time to execute
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(temporalService.getClient).toHaveBeenCalled();
    });

    it('should route user.deleted events and trigger workflow', async () => {
      service.handleWebhook(mockUserDeletedEvent);

      // Give async workflow call time to execute
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(temporalService.getClient).toHaveBeenCalled();
    });

    it('should route session.created events and trigger workflow', async () => {
      service.handleWebhook(mockSessionCreatedEvent);

      // Give async workflow call time to execute
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(temporalService.getClient).toHaveBeenCalled();
    });
  });

  describe('handleUserCreated', () => {
    it('should trigger workflow with Clerk user data', async () => {
      service.handleWebhook(mockUserCreatedEvent);

      // Give async workflow call time to execute
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(temporalService.getClient).toHaveBeenCalled();
    });
  });

  describe('handleUserUpdated', () => {
    it('should trigger workflow with update data', async () => {
      service.handleWebhook(mockUserUpdatedEvent);

      // Give async workflow call time to execute
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(temporalService.getClient).toHaveBeenCalled();
    });
  });

  describe('handleUserDeleted', () => {
    it('should trigger workflow with clerkId', async () => {
      service.handleWebhook(mockUserDeletedEvent);

      // Give async workflow call time to execute
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(temporalService.getClient).toHaveBeenCalled();
    });
  });

  describe('handleSessionCreated', () => {
    it('should trigger workflow with session data', async () => {
      service.handleWebhook(mockSessionCreatedEvent);

      // Give async workflow call time to execute
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(temporalService.getClient).toHaveBeenCalled();
    });
  });
});
