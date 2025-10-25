// Clerk webhook event types
export type ClerkWebhookEventType =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'session.created';

// Clerk email address structure
export type ClerkEmailAddress = {
  id: string;
  email_address: string;
  verification: {
    status: string;
  };
};

// Clerk phone number structure
export type ClerkPhoneNumber = {
  id: string;
  phone_number: string;
  verification?: {
    status: string;
  };
};

// Clerk external account structure
export type ClerkExternalAccount = {
  id: string;
  provider: string;
  email_address?: string;
};

// Clerk web3 wallet structure
export type ClerkWeb3Wallet = {
  id: string;
  web3_wallet: string;
};

// Locale information
export type LocaleInfo = {
  timezone?: string | null;
  locale?: string | null;
  region?: string | null;
};

// Clerk user metadata
export type ClerkMetadata = {
  mood?: string | null;
  locale?: LocaleInfo;
  [key: string]: unknown;
};

// Full Clerk user data structure
export type ClerkUserData = {
  id: string;
  first_name: string;
  last_name: string;
  email_addresses: ClerkEmailAddress[];
  primary_email_address_id: string | null;
  phone_numbers: ClerkPhoneNumber[];
  primary_phone_number_id: string | null;
  image_url: string;
  profile_image_url: string;
  username: string | null;
  birthday: string | null;
  created_at: number;
  updated_at: number;
  last_sign_in_at: number | null;
  last_active_at?: number;
  two_factor_enabled: boolean;
  password_enabled: boolean;
  external_id: string | null;
  gender: string | null;
  object: string;
  primary_web3_wallet_id: string | null;
  private_metadata: ClerkMetadata;
  public_metadata: ClerkMetadata;
  unsafe_metadata: ClerkMetadata;
  external_accounts: ClerkExternalAccount[];
  web3_wallets: ClerkWeb3Wallet[];
};

// Webhook event payloads
export type UserCreatedEvent = {
  type: 'user.created';
  data: ClerkUserData;
};

export type UserUpdatedEvent = {
  type: 'user.updated';
  data: ClerkUserData;
};

export type UserDeletedEvent = {
  type: 'user.deleted';
  data: {
    id: string;
    deleted: boolean;
  };
};

export type SessionCreatedEvent = {
  type: 'session.created';
  data: {
    id: string;
    user_id: string;
    last_active_at: number;
    created_at: number;
  };
};

// Union type for all webhook events
export type ClerkWebhookEvent =
  | UserCreatedEvent
  | UserUpdatedEvent
  | UserDeletedEvent
  | SessionCreatedEvent;
