/**
 * Represents the authenticated user context from Clerk
 */
export type AuthObject = {
  userId: string;
  sessionId?: string;
  orgId?: string;
};
