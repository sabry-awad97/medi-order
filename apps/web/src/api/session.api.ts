/**
 * Session API
 *
 * Provides type-safe access to session-related Tauri commands.
 * Handles session validation, logout, and session management.
 *
 * @module api/session
 */

import { z } from "zod";
import { invokeCommand } from "@/lib/tauri-api";
import { createLogger } from "@/lib/logger";
import { UserIdSchema } from "./user.api";

const logger = createLogger("SessionAPI");

// ============================================================================
// Schemas
// ============================================================================

/**
 * Session token DTO schema
 */
export const SessionTokenSchema = z.object({
  token: z.string(),
});
export type SessionToken = z.infer<typeof SessionTokenSchema>;

/**
 * Session response schema
 */
export const SessionResponseSchema = z.object({
  id: z.string().uuid(),
  user_id: UserIdSchema,
  token: z.string(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  expires_at: z.string(),
  last_activity_at: z.string(),
  created_at: z.string(),
});
export type SessionResponse = z.infer<typeof SessionResponseSchema>;

/**
 * Mutation result schema
 */
export const MutationResultSchema = z.object({
  id: z.string().uuid(),
});
export type MutationResult = z.infer<typeof MutationResultSchema>;

// ============================================================================
// Session Operations
// ============================================================================

/**
 * Validate a session token
 * Updates last_activity_at on successful validation
 */
export async function validateSession(token: string): Promise<SessionResponse> {
  logger.info("Validating session");
  return invokeCommand("validate_session", SessionResponseSchema, {
    params: { data: { token } },
  });
}

/**
 * Logout (delete current session)
 */
export async function logoutSession(token: string): Promise<void> {
  logger.info("Logging out session");
  // Backend returns IpcResponse<()> which serializes to {"data": null}
  await invokeCommand(
    "logout_session",
    z.null().transform(() => undefined),
    {
      params: { data: { token } },
    },
  );
}

/**
 * Logout all sessions for a user
 */
export async function logoutAllSessions(userId: string): Promise<number> {
  logger.info("Logging out all sessions for user:", userId);
  const result = await invokeCommand("logout_all_sessions", z.number(), {
    params: { id: userId },
  });
  return result;
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(
  userId: string,
): Promise<SessionResponse[]> {
  logger.info("Getting user sessions:", userId);
  return invokeCommand("get_user_sessions", z.array(SessionResponseSchema), {
    params: { id: userId },
  });
}

/**
 * Cleanup expired sessions (maintenance operation)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  logger.info("Cleaning up expired sessions");
  const result = await invokeCommand(
    "cleanup_expired_sessions",
    z.number(),
    {},
  );
  return result;
}

// ============================================================================
// Exports
// ============================================================================

export const sessionApi = {
  validate: validateSession,
  logout: logoutSession,
  logoutAll: logoutAllSessions,
  getUserSessions,
  cleanup: cleanupExpiredSessions,
} as const;
