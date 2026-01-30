/**
 * Protected Route Component
 *
 * Wrapper component for routes that require authentication.
 * Redirects to login if user is not authenticated.
 *
 * @module components/auth/protected-route
 */

import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Loading } from "@/components/ui/loading";
import { createLogger } from "@/lib/logger";

const logger = createLogger("ProtectedRoute");

// ============================================================================
// Types
// ============================================================================

interface ProtectedRouteProps {
  children: ReactNode;
  /**
   * Required permissions (user must have at least one)
   */
  permissions?: string[];
  /**
   * Required roles (user must have at least one)
   */
  roles?: string[];
  /**
   * Redirect path if not authenticated
   */
  redirectTo?: string;
  /**
   * Custom fallback component for unauthorized access
   */
  fallback?: ReactNode;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Protected Route Component
 *
 * Protects routes by checking authentication and optionally permissions/roles.
 *
 * @example
 * ```tsx
 * // Basic protection (authentication only)
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 *
 * // With permission check
 * <ProtectedRoute permissions={['users.view']}>
 *   <UsersList />
 * </ProtectedRoute>
 *
 * // With role check
 * <ProtectedRoute roles={['admin', 'manager']}>
 *   <AdminPanel />
 * </ProtectedRoute>
 *
 * // With custom redirect
 * <ProtectedRoute redirectTo="/unauthorized">
 *   <SecretPage />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  permissions,
  roles,
  redirectTo = "/login",
  fallback,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();

  // ============================================================================
  // Authentication Check
  // ============================================================================

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      logger.warn("User not authenticated, redirecting to login");

      // Store the current path to redirect back after login
      const currentPath = router.state.location.pathname;
      const searchParams = new URLSearchParams();
      searchParams.set("redirect", currentPath);

      navigate({
        to: redirectTo,
        search: { redirect: currentPath },
      });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo, router]);

  // ============================================================================
  // Loading State
  // ============================================================================

  if (isLoading) {
    return <Loading />;
  }

  // ============================================================================
  // Not Authenticated
  // ============================================================================

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  // ============================================================================
  // Permission Check
  // ============================================================================

  if (permissions && permissions.length > 0) {
    const hasRequiredPermission = permissions.some((permission) =>
      user?.permissions?.includes(permission),
    );

    if (!hasRequiredPermission) {
      logger.warn("User lacks required permissions:", permissions);

      if (fallback) {
        return <>{fallback}</>;
      }

      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="mt-2 text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      );
    }
  }

  // ============================================================================
  // Role Check
  // ============================================================================

  if (roles && roles.length > 0) {
    const hasRequiredRole = roles.some((role) => user?.roles?.includes(role));

    if (!hasRequiredRole) {
      logger.warn("User lacks required roles:", roles);

      if (fallback) {
        return <>{fallback}</>;
      }

      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="mt-2 text-muted-foreground">
              You don't have the required role to access this page.
            </p>
          </div>
        </div>
      );
    }
  }

  // ============================================================================
  // Authorized
  // ============================================================================

  return <>{children}</>;
}

// ============================================================================
// Higher-Order Component
// ============================================================================

/**
 * Higher-order component to protect a component
 *
 * @example
 * ```tsx
 * const ProtectedDashboard = withAuth(Dashboard, {
 *   permissions: ['dashboard.view'],
 * });
 * ```
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, "children">,
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
