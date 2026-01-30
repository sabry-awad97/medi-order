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
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";
import {
  getAuthState,
  setAuthTokens,
  setAuthUser,
  clearAuth,
  isTokenExpired,
  getTokenTimeToExpiry,
  type AuthState,
  type AuthUser,
  type AuthTokens,
} from "@/lib/auth";
import { userApi, type Login, type LoginResponse } from "@/api/user.api";

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

  const navigate = useNavigate();

  // ============================================================================
  // Session Validation
  // ============================================================================

  /**
   * Validate session on mount and periodically
   */
  useEffect(() => {
    const validateSession = () => {
      if (authState.isAuthenticated && isTokenExpired()) {
        logger.warn("Session expired, logging out");
        toast.error("Your session has expired. Please login again.");
        handleLogout();
      }
    };

    // Validate immediately
    validateSession();

    // Validate every minute
    const interval = setInterval(validateSession, 60 * 1000);

    return () => clearInterval(interval);
  }, [authState.isAuthenticated]);

  // ============================================================================
  // Auto Token Refresh
  // ============================================================================

  /**
   * Automatically refresh token before expiry
   */
  useEffect(() => {
    if (!authState.isAuthenticated) {
      return;
    }

    const timeToExpiry = getTokenTimeToExpiry();

    if (!timeToExpiry) {
      return;
    }

    // Refresh 5 minutes before expiry
    const refreshTime = Math.max(0, timeToExpiry - 5 * 60 * 1000);

    logger.info(`Token will be refreshed in ${refreshTime / 1000} seconds`);

    const timeout = setTimeout(() => {
      logger.info("Auto-refreshing token");
      refreshSession();
    }, refreshTime);

    return () => clearTimeout(timeout);
  }, [authState.isAuthenticated, authState.token]);

  // ============================================================================
  // Login
  // ============================================================================

  const handleLogin = useCallback(
    async (credentials: Login) => {
      try {
        logger.info("Attempting login:", credentials.username);

        setAuthState((prev) => ({ ...prev, isLoading: true }));

        // Call login API
        const response: LoginResponse = await userApi.login(credentials);

        logger.info("Login successful:", response.user.username);

        // Store tokens
        if (response.token) {
          setAuthTokens({
            accessToken: response.token,
          });
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

        // Navigate to dashboard
        navigate({ to: "/" });
      } catch (error) {
        logger.error("Login failed:", error);

        setAuthState((prev) => ({ ...prev, isLoading: false }));

        const errorMessage =
          error instanceof Error ? error.message : "Login failed";
        toast.error(errorMessage);

        throw error;
      }
    },
    [navigate],
  );

  // ============================================================================
  // Logout
  // ============================================================================

  const handleLogout = useCallback(async () => {
    try {
      logger.info("Logging out user:", authState.user?.username);

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

      // Navigate to login
      navigate({ to: "/login" });
    } catch (error) {
      logger.error("Logout failed:", error);
      toast.error("Failed to logout properly");
    }
  }, [authState.user, navigate]);

  // ============================================================================
  // Refresh Session
  // ============================================================================

  const refreshSession = useCallback(async () => {
    try {
      if (!authState.user) {
        logger.warn("Cannot refresh session: no user");
        return;
      }

      logger.info("Refreshing session for user:", authState.user.username);

      // In a real app, you would call a refresh token endpoint
      // For now, we'll just validate the current session
      const currentState = getAuthState();

      if (!currentState.isAuthenticated) {
        logger.warn("Session is no longer valid");
        handleLogout();
        return;
      }

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
