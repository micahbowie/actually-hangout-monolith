/**
 * Validates push notification token formats
 */

const EXPO_TOKEN_REGEX = /^ExponentPushToken\[[a-zA-Z0-9_-]+\]$/;
const FCM_TOKEN_REGEX = /^[a-zA-Z0-9_-]{152,}$/;
const APNS_TOKEN_REGEX = /^[a-fA-F0-9]{64}$/;

export type PushTokenFormat = 'expo' | 'fcm' | 'apns' | 'unknown';

export type PushTokenValidationResult = {
  isValid: boolean;
  format: PushTokenFormat;
  reason?: string;
};

/**
 * Validates a push notification token against known formats
 * Supports: Expo, FCM (Firebase Cloud Messaging), and APNs (Apple Push Notification service)
 */
export function validatePushToken(token: string): PushTokenValidationResult {
  if (!token || typeof token !== 'string') {
    return {
      isValid: false,
      format: 'unknown',
      reason: 'Token must be a non-empty string',
    };
  }

  // Check minimum length
  if (token.length < 10) {
    return {
      isValid: false,
      format: 'unknown',
      reason: 'Token must be at least 10 characters long',
    };
  }

  // Check maximum length to prevent abuse
  if (token.length > 500) {
    return {
      isValid: false,
      format: 'unknown',
      reason: 'Token exceeds maximum length of 500 characters',
    };
  }

  // Validate Expo token format
  if (EXPO_TOKEN_REGEX.test(token)) {
    return {
      isValid: true,
      format: 'expo',
    };
  }

  // Validate FCM token format
  if (FCM_TOKEN_REGEX.test(token)) {
    return {
      isValid: true,
      format: 'fcm',
    };
  }

  // Validate APNs token format
  if (APNS_TOKEN_REGEX.test(token)) {
    return {
      isValid: true,
      format: 'apns',
    };
  }

  // Token doesn't match any known format
  return {
    isValid: false,
    format: 'unknown',
    reason:
      'Token does not match any known push notification format (Expo, FCM, or APNs)',
  };
}

/**
 * Maximum number of push tokens allowed per user
 */
export const MAX_TOKENS_PER_USER = 10;
