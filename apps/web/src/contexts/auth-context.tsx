/**
 * Authentication Context
 *
 * Provides authentication state and methods throughout the application.
 * Handles login, logout, token refresh, and session management.
 *
 * @module contexts/auth-context
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";
import {
  getAuthState,
  setAuthSession,
  setAuthUser,
  clearAuth,
  getSessionToken,
  type AuthState,
  type AuthUser,
} from "@/lib/auth";
import { userApi, type Login, type LoginResponse } from "@/api/user.api";
import { sessionApi } from "@/api/session.api";

const logger = createLogger("AuthContext");

// ============================================================================
// Types
// ============================================================================

interface AuthContextValue extends AuthState {
  login: (credentials: Login) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>(() => {
    // Initialize from storage
    const initialState = getAuthState();
    logger.info("Initial auth state:", {
      isAuthenticated: initialState.isAuthenticated,
      hasUser: !!initialState.user,
      hasToken: !!initialState.token,
    });
    return initialState;
  });

  // ============================================================================
  // Session Validation
  // ============================================================================

  /**
   * Validate session on mount and periodically
   */
  useEffect(() => {
    const validateCurrentSession = async () => {
      const token = getSessionToken();

      if (!token || !authState.isAuthenticated) {
        return;
      }

      try {
        // Validate session with backend
        await sessionApi.validate(token);
        logger.info("Session validated successfully");
      } catch (error) {
        logger.warn("Session validation failed:", error);
        toast.error("Your session has expired. Please login again.");
        handleLogout();
      }
    };

    // Skip immediate validation on mount - session was just created or loaded
    // Only validate periodically after initial mount
    const interval = setInterval(validateCurrentSession, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [authState.isAuthenticated]);

  // ============================================================================
  // Login
  // ============================================================================

  const handleLogin = useCallback(async (credentials: Login) => {
    try {
      logger.info("Attempting login:", credentials.username);

      setAuthState((prev) => ({ ...prev, isLoading: true }));

      // Call login API (now returns session token instead of JWT)
      const response: LoginResponse = await userApi.login(credentials);

      logger.info("Login successful:", response.user.username);

      // Store session token
      if (response.token) {
        setAuthSession(response.token);
      }

      // Store user data
      const authUser: AuthUser = {
        ...response.user,
        // Add permissions and roles if available from backend
        permissions: [],
        roles: [],
      };

      setAuthUser(authUser);

      // Update state
      setAuthState({
        user: authUser,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });

      toast.success(`Welcome back, ${response.user.first_name}!`);

      // Don't navigate here - let the calling component handle navigation
    } catch (error) {
      logger.error("Login failed:", error);

      setAuthState((prev) => ({ ...prev, isLoading: false }));

      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      toast.error(errorMessage);

      throw error;
    }
  }, []);

  // ============================================================================
  // Logout
  // ============================================================================

  const handleLogout = useCallback(async () => {
    try {
      logger.info("Logging out user:", authState.user?.username);

      const token = getSessionToken();

      // Delete session from backend
      if (token) {
        try {
          await sessionApi.logout(token);
          logger.info("Session deleted from backend");
        } catch (error) {
          logger.error("Failed to delete session from backend:", error);
          // Continue with local logout even if backend fails
        }
      }

      // Clear auth data
      clearAuth();

      // Update state
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });

      toast.info("You have been logged out");

      // Don't navigate here - let the calling component handle navigation
    } catch (error) {
      logger.error("Logout failed:", error);
      toast.error("Failed to logout properly");
    }
  }, [authState.user]);

  // ============================================================================
  // Refresh Session
  // ============================================================================

  const refreshSession = useCallback(async () => {
    try {
      const token = getSessionToken();

      if (!token || !authState.user) {
        logger.warn("Cannot refresh session: no token or user");
        return;
      }

      logger.info("Refreshing session for user:", authState.user.username);

      // Validate session (this also updates last_activity_at)
      await sessionApi.validate(token);

      logger.info("Session refreshed successfully");
    } catch (error) {
      logger.error("Failed to refresh session:", error);
      handleLogout();
    }
  }, [authState.user, handleLogout]);

  // ============================================================================
  // Update User
  // ============================================================================

  const updateUser = useCallback((user: AuthUser) => {
    logger.info("Updating user data:", user.username);

    setAuthUser(user);

    setAuthState((prev) => ({
      ...prev,
      user,
    }));
  }, []);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: AuthContextValue = {
    ...authState,
    login: handleLogin,
    logout: handleLogout,
    refreshSession,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Use authentication context
 *
 * @throws Error if used outside AuthProvider
 *
 * @example
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth();
 *
 * if (!isAuthenticated) {
 *   return <LoginForm onSubmit={login} />;
 * }
 *
 * return <div>Welcome, {user.first_name}!</div>;
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

/**
 * Use authentication check
 *
 * Returns only the authentication status without the full context.
 * Useful for components that only need to check if user is logged in.
 *
 * @example
 * ```tsx
 * const isAuthenticated = useAuthCheck();
 *
 * if (!isAuthenticated) {
 *   return <Navigate to="/login" />;
 * }
 * ```
 */
export function useAuthCheck(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

/**
 * Use current user
 *
 * Returns the current authenticated user or null.
 *
 * @example
 * ```tsx
 * const user = useCurrentUser();
 *
 * if (!user) {
 *   return <div>Not logged in</div>;
 * }
 *
 * return <div>Hello, {user.first_name}!</div>;
 * ```
 */
export function useCurrentUser(): AuthUser | null {
  const { user } = useAuth();
  return user;
}
