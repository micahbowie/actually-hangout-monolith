import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import {
  UserCreatedEvent,
  UserUpdatedEvent,
  UserDeletedEvent,
  SessionCreatedEvent,
} from '../users/types/clerk-webhook.types';

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

describe('WebhooksController', () => {
  let controller: WebhooksController;
  let service: jest.Mocked<WebhooksService>;

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
    const mockWebhooksService = {
      handleWebhook: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [
        {
          provide: WebhooksService,
          useValue: mockWebhooksService,
        },
      ],
    }).compile();

    controller = module.get<WebhooksController>(WebhooksController);
    service = module.get(WebhooksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleClerkWebhook', () => {
    it('should handle user.created event', () => {
      service.handleWebhook.mockReturnValue(undefined);

      controller.handleClerkWebhook(mockUserCreatedEvent);

      expect(service.handleWebhook).toHaveBeenCalledWith(mockUserCreatedEvent);
    });

    it('should handle user.updated event', () => {
      service.handleWebhook.mockReturnValue(undefined);

      controller.handleClerkWebhook(mockUserUpdatedEvent);

      expect(service.handleWebhook).toHaveBeenCalledWith(mockUserUpdatedEvent);
    });

    it('should handle user.deleted event', () => {
      service.handleWebhook.mockReturnValue(undefined);

      controller.handleClerkWebhook(mockUserDeletedEvent);

      expect(service.handleWebhook).toHaveBeenCalledWith(mockUserDeletedEvent);
    });

    it('should handle session.created event', () => {
      service.handleWebhook.mockReturnValue(undefined);

      controller.handleClerkWebhook(mockSessionCreatedEvent);

      expect(service.handleWebhook).toHaveBeenCalledWith(
        mockSessionCreatedEvent,
      );
    });

    it('should propagate errors from service', () => {
      const error = new Error('Service error');
      service.handleWebhook.mockImplementation(() => {
        throw error;
      });

      expect(() => controller.handleClerkWebhook(mockUserCreatedEvent)).toThrow(
        'Service error',
      );
    });
  });
});
