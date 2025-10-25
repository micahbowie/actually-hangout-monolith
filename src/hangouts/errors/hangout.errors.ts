/**
 * Custom error classes for hangout domain
 * These allow for type-safe error handling instead of fragile string matching
 */

export class HangoutNotFoundError extends Error {
  constructor(message = 'Hangout not found') {
    super(message);
    this.name = 'HangoutNotFoundError';
  }
}

export class HangoutUnauthorizedError extends Error {
  constructor(message = 'Not authorized to perform this action') {
    super(message);
    this.name = 'HangoutUnauthorizedError';
  }
}

export class InvalidHangoutIdError extends Error {
  constructor(message = 'Invalid hangout ID') {
    super(message);
    this.name = 'InvalidHangoutIdError';
  }
}

export class InvalidPaginationTokenError extends Error {
  constructor(message = 'Invalid pagination token') {
    super(message);
    this.name = 'InvalidPaginationTokenError';
  }
}

export class UserNotFoundError extends Error {
  constructor(message = 'User not found') {
    super(message);
    this.name = 'UserNotFoundError';
  }
}
