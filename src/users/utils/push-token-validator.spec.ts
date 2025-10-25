import { validatePushToken, MAX_TOKENS_PER_USER } from './push-token-validator';

describe('Push Token Validator', () => {
  describe('validatePushToken', () => {
    describe('Expo tokens', () => {
      it('validates correct Expo token format', () => {
        const token = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';
        const result = validatePushToken(token);

        expect(result.isValid).toBe(true);
        expect(result.format).toBe('expo');
        expect(result.reason).toBeUndefined();
      });

      it('validates Expo token with alphanumeric and dashes', () => {
        const token = 'ExponentPushToken[abc123_xyz-789]';
        const result = validatePushToken(token);

        expect(result.isValid).toBe(true);
        expect(result.format).toBe('expo');
      });

      it('rejects malformed Expo token', () => {
        const token = 'ExponentPushToken-abc123';
        const result = validatePushToken(token);

        expect(result.isValid).toBe(false);
        expect(result.format).toBe('unknown');
      });
    });

    describe('FCM tokens', () => {
      it('validates correct FCM token format', () => {
        const token = 'a'.repeat(152);
        const result = validatePushToken(token);

        expect(result.isValid).toBe(true);
        expect(result.format).toBe('fcm');
      });

      it('validates long FCM token', () => {
        const token = 'a'.repeat(200);
        const result = validatePushToken(token);

        expect(result.isValid).toBe(true);
        expect(result.format).toBe('fcm');
      });

      it('rejects FCM token that is too short', () => {
        const token = 'a'.repeat(150);
        const result = validatePushToken(token);

        expect(result.isValid).toBe(false);
      });
    });

    describe('APNs tokens', () => {
      it('validates correct APNs token format', () => {
        const token = 'a1b2c3d4e5f67890'.repeat(4);
        const result = validatePushToken(token);

        expect(result.isValid).toBe(true);
        expect(result.format).toBe('apns');
      });

      it('validates APNs token with uppercase hex', () => {
        const token = 'ABCDEF0123456789'.repeat(4);
        const result = validatePushToken(token);

        expect(result.isValid).toBe(true);
        expect(result.format).toBe('apns');
      });

      it('rejects APNs token with invalid characters', () => {
        const token = 'g'.repeat(64);
        const result = validatePushToken(token);

        expect(result.isValid).toBe(false);
      });

      it('rejects APNs token with wrong length', () => {
        const token = 'a'.repeat(63);
        const result = validatePushToken(token);

        expect(result.isValid).toBe(false);
      });
    });

    describe('Invalid inputs', () => {
      it('rejects null token', () => {
        const result = validatePushToken(null as never);

        expect(result.isValid).toBe(false);
        expect(result.reason).toBe('Token must be a non-empty string');
      });

      it('rejects undefined token', () => {
        const result = validatePushToken(undefined as never);

        expect(result.isValid).toBe(false);
        expect(result.reason).toBe('Token must be a non-empty string');
      });

      it('rejects empty string', () => {
        const result = validatePushToken('');

        expect(result.isValid).toBe(false);
        expect(result.reason).toBe('Token must be a non-empty string');
      });

      it('rejects token that is too short', () => {
        const result = validatePushToken('short');

        expect(result.isValid).toBe(false);
        expect(result.reason).toBe('Token must be at least 10 characters long');
      });

      it('rejects token that exceeds maximum length', () => {
        const longToken = 'a'.repeat(501);
        const result = validatePushToken(longToken);

        expect(result.isValid).toBe(false);
        expect(result.reason).toBe(
          'Token exceeds maximum length of 500 characters',
        );
      });

      it('rejects token with unknown format', () => {
        const token = 'invalid_token_format_1234567890';
        const result = validatePushToken(token);

        expect(result.isValid).toBe(false);
        expect(result.format).toBe('unknown');
        expect(result.reason).toBe(
          'Token does not match any known push notification format (Expo, FCM, or APNs)',
        );
      });
    });
  });

  describe('MAX_TOKENS_PER_USER', () => {
    it('has a reasonable limit', () => {
      expect(MAX_TOKENS_PER_USER).toBe(10);
      expect(MAX_TOKENS_PER_USER).toBeGreaterThan(0);
      expect(MAX_TOKENS_PER_USER).toBeLessThan(100);
    });
  });
});
