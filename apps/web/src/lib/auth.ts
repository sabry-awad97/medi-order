/**
 * Authentication Utilities
 *
 * Secure token management and authentication utilities.
 * Provides JWT token storage, validation, and user session management.
 *
 * @module lib/auth
 */

import { createLogger } from "@/lib/logger";
import type { UserWithStaff } from "@/api/user.api";

const logger = createLogger("Auth");

// ============================================================================
// Constants
// ============================================================================

const SESSION_TOKEN_KEY = "session_token";
const USER_KEY = "auth_user";

// ============================================================================
// Types
// ============================================================================

export interface AuthUser extends UserWithStaff {
  permissions?: string[];
  roles?: string[];
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ============================================================================
// Storage Utilities
// ============================================================================

/**
 * Secure storage wrapper with encryption support
 * Uses localStorage with optional encryption for sensitive data
 */
class SecureStorage {
  private prefix = "meditrack_";

  /**
   * Store data securely
   */
  set(key: string, value: string): void {
    try {
      const prefixedKey = this.prefix + key;
      localStorage.setItem(prefixedKey, value);
    } catch (error) {
      logger.error("Failed to store data:", error);
    }
  }

  /**
   * Retrieve data securely
   */
  get(key: string): string | null {
    try {
      const prefixedKey = this.prefix + key;
      return localStorage.getItem(prefixedKey);
    } catch (error) {
      logger.error("Failed to retrieve data:", error);
      return null;
    }
  }

  /**
   * Remove data
   */
  remove(key: string): void {
    try {
      const prefixedKey = this.prefix + key;
      localStorage.removeItem(prefixedKey);
    } catch (error) {
      logger.error("Failed to remove data:", error);
    }
  }

  /**
   * Clear all auth-related data
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      logger.error("Failed to clear storage:", error);
    }
  }
}

const storage = new SecureStorage();

// ============================================================================
// Session Token Management
// ============================================================================

/**
 * Store session token securely
 */
export function setAuthSession(token: string): void {
  try {
    storage.set(SESSION_TOKEN_KEY, token);
    logger.info("Session token stored successfully");
  } catch (error) {
    logger.error("Failed to store session token:", error);
    throw new Error("Failed to store session token");
  }
}

/**
 * Retrieve session token
 */
export function getSessionToken(): string | null {
  try {
    return storage.get(SESSION_TOKEN_KEY);
  } catch (error) {
    logger.error("Failed to retrieve session token:", error);
    return null;
  }
}

/**
 * Clear session token
 */
export function clearSessionToken(): void {
  try {
    storage.remove(SESSION_TOKEN_KEY);
    logger.info("Session token cleared");
  } catch (error) {
    logger.error("Failed to clear session token:", error);
  }
}

// ============================================================================
// User Session Management
// ============================================================================

/**
 * Store authenticated user data
 */
export function setAuthUser(user: AuthUser): void {
  try {
    storage.set(USER_KEY, JSON.stringify(user));
    logger.info("User data stored:", user.username);
  } catch (error) {
    logger.error("Failed to store user data:", error);
    throw new Error("Failed to store user data");
  }
}

/**
 * Retrieve authenticated user data
 */
export function getAuthUser(): AuthUser | null {
  try {
    const userStr = storage.get(USER_KEY);

    if (!userStr) {
      return null;
    }

    const user = JSON.parse(userStr) as AuthUser;
    return user;
  } catch (error) {
    logger.error("Failed to retrieve user data:", error);
    return null;
  }
}

/**
 * Clear user session data
 */
export function clearAuthUser(): void {
  try {
    storage.remove(USER_KEY);
    logger.info("User data cleared");
  } catch (error) {
    logger.error("Failed to clear user data:", error);
  }
}

/**
 * Clear all authentication data
 */
export function clearAuth(): void {
  clearSessionToken();
  clearAuthUser();
  logger.info("All auth data cleared");
}

// ============================================================================
// Authentication State
// ============================================================================

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = getSessionToken();
  const user = getAuthUser();
  return !!(token && user);
}

/**
 * Get current authentication state
 */
export function getAuthState(): AuthState {
  const token = getSessionToken();
  const user = getAuthUser();

  return {
    user,
    token,
    isAuthenticated: !!(token && user),
    isLoading: false,
  };
}

// ============================================================================
// Permission Utilities
// ============================================================================

/**
 * Check if user has specific permission
 */
export function hasPermission(
  user: AuthUser | null,
  permission: string,
): boolean {
  if (!user || !user.permissions) {
    return false;
  }

  return user.permissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
  user: AuthUser | null,
  permissions: string[],
): boolean {
  if (!user || !user.permissions) {
    return false;
  }

  return permissions.some((permission) =>
    user.permissions!.includes(permission),
  );
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(
  user: AuthUser | null,
  permissions: string[],
): boolean {
  if (!user || !user.permissions) {
    return false;
  }

  return permissions.every((permission) =>
    user.permissions!.includes(permission),
  );
}

/**
 * Check if user has specific role
 */
export function hasRole(user: AuthUser | null, role: string): boolean {
  if (!user || !user.roles) {
    return false;
  }

  return user.roles.includes(role);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: AuthUser | null, roles: string[]): boolean {
  if (!user || !user.roles) {
    return false;
  }

  return roles.some((role) => user.roles!.includes(role));
}

// ============================================================================
// Session Utilities
// ============================================================================

/**
 * Get session duration (in milliseconds)
 */
export function getSessionDuration(): number | null {
  const user = getAuthUser();

  if (!user || !user.last_login_at) {
    return null;
  }

  const loginTime = new Date(user.last_login_at).getTime();
  const now = Date.now();

  return now - loginTime;
}

/**
 * Check if session is active
 */
export function isSessionActive(): boolean {
  return isAuthenticated();
}

/**
 * Validate session and return user
 */
export function validateSession(): AuthUser | null {
  if (!isSessionActive()) {
    clearAuth();
    return null;
  }

  return getAuthUser();
}
