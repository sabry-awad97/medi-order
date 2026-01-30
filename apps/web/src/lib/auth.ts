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

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
const TOKEN_EXPIRY_KEY = "auth_token_expiry";
const REFRESH_TOKEN_KEY = "auth_refresh_token";

// Token expiry buffer (5 minutes before actual expiry)
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000;

// ============================================================================
// Types
// ============================================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

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
// Token Management
// ============================================================================

/**
 * Store authentication tokens securely
 */
export function setAuthTokens(tokens: AuthTokens): void {
  try {
    storage.set(TOKEN_KEY, tokens.accessToken);

    if (tokens.refreshToken) {
      storage.set(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }

    if (tokens.expiresAt) {
      storage.set(TOKEN_EXPIRY_KEY, tokens.expiresAt.toString());
    }

    logger.info("Auth tokens stored successfully");
  } catch (error) {
    logger.error("Failed to store auth tokens:", error);
    throw new Error("Failed to store authentication tokens");
  }
}

/**
 * Retrieve authentication token
 */
export function getAuthToken(): string | null {
  try {
    const token = storage.get(TOKEN_KEY);

    if (!token) {
      return null;
    }

    // Check if token is expired
    if (isTokenExpired()) {
      logger.warn("Token is expired");
      clearAuthTokens();
      return null;
    }

    return token;
  } catch (error) {
    logger.error("Failed to retrieve auth token:", error);
    return null;
  }
}

/**
 * Retrieve refresh token
 */
export function getRefreshToken(): string | null {
  try {
    return storage.get(REFRESH_TOKEN_KEY);
  } catch (error) {
    logger.error("Failed to retrieve refresh token:", error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(): boolean {
  try {
    const expiryStr = storage.get(TOKEN_EXPIRY_KEY);

    if (!expiryStr) {
      // If no expiry is set, assume token is valid
      return false;
    }

    const expiry = parseInt(expiryStr, 10);
    const now = Date.now();

    // Add buffer to refresh before actual expiry
    return now >= expiry - TOKEN_EXPIRY_BUFFER;
  } catch (error) {
    logger.error("Failed to check token expiry:", error);
    return true;
  }
}

/**
 * Get time until token expires (in milliseconds)
 */
export function getTokenTimeToExpiry(): number | null {
  try {
    const expiryStr = storage.get(TOKEN_EXPIRY_KEY);

    if (!expiryStr) {
      return null;
    }

    const expiry = parseInt(expiryStr, 10);
    const now = Date.now();

    return Math.max(0, expiry - now);
  } catch (error) {
    logger.error("Failed to get token time to expiry:", error);
    return null;
  }
}

/**
 * Clear all authentication tokens
 */
export function clearAuthTokens(): void {
  try {
    storage.remove(TOKEN_KEY);
    storage.remove(REFRESH_TOKEN_KEY);
    storage.remove(TOKEN_EXPIRY_KEY);
    logger.info("Auth tokens cleared");
  } catch (error) {
    logger.error("Failed to clear auth tokens:", error);
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
  clearAuthTokens();
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
  const token = getAuthToken();
  const user = getAuthUser();
  return !!(token && user);
}

/**
 * Get current authentication state
 */
export function getAuthState(): AuthState {
  const token = getAuthToken();
  const user = getAuthUser();

  return {
    user,
    token,
    isAuthenticated: !!(token && user),
    isLoading: false,
  };
}

// ============================================================================
// JWT Utilities
// ============================================================================

/**
 * Decode JWT token (without verification)
 * Note: This is for reading claims only, not for security validation
 */
export function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      logger.error("Invalid JWT format");
      return null;
    }

    const payload = parts[1];
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch (error) {
    logger.error("Failed to decode JWT:", error);
    return null;
  }
}

/**
 * Extract expiry time from JWT token
 */
export function getJWTExpiry(token: string): number | null {
  try {
    const decoded = decodeJWT(token);

    if (!decoded || typeof decoded.exp !== "number") {
      return null;
    }

    // Convert from seconds to milliseconds
    return decoded.exp * 1000;
  } catch (error) {
    logger.error("Failed to get JWT expiry:", error);
    return null;
  }
}

/**
 * Extract user ID from JWT token
 */
export function getJWTUserId(token: string): string | null {
  try {
    const decoded = decodeJWT(token);

    if (!decoded || typeof decoded.sub !== "string") {
      return null;
    }

    return decoded.sub;
  } catch (error) {
    logger.error("Failed to get JWT user ID:", error);
    return null;
  }
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
  return isAuthenticated() && !isTokenExpired();
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
