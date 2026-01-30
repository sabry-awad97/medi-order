/**
 * Authentication Hooks
 *
 * Provides convenient hooks for authentication operations.
 * Re-exports from auth context and adds additional utilities.
 *
 * @module hooks/use-auth
 */

export { useAuth, useAuthCheck, useCurrentUser } from "@/contexts/auth-context";

import { useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  hasPermission,
  hasRole,
  hasAnyPermission,
  hasAllPermissions,
  hasAnyRole,
} from "@/lib/auth";

/**
 * Use permission check
 *
 * @param permission - Permission to check
 * @returns Boolean indicating if user has permission
 *
 * @example
 * ```tsx
 * const canEdit = usePermission('users.edit');
 *
 * if (!canEdit) {
 *   return <div>You don't have permission to edit users</div>;
 * }
 * ```
 */
export function usePermission(permission: string): boolean {
  const { user } = useAuth();
  return hasPermission(user, permission);
}

/**
 * Use role check
 *
 * @param role - Role to check
 * @returns Boolean indicating if user has role
 *
 * @example
 * ```tsx
 * const isAdmin = useRole('admin');
 *
 * if (!isAdmin) {
 *   return <div>Admin access required</div>;
 * }
 * ```
 */
export function useRole(role: string): boolean {
  const { user } = useAuth();
  return hasRole(user, role);
}

/**
 * Use multiple permission check (any)
 *
 * @param permissions - Array of permissions to check
 * @returns Boolean indicating if user has any of the permissions
 *
 * @example
 * ```tsx
 * const canManageUsers = useAnyPermission(['users.create', 'users.edit', 'users.delete']);
 * ```
 */
export function useAnyPermission(permissions: string[]): boolean {
  const { user } = useAuth();
  return hasAnyPermission(user, permissions);
}

/**
 * Use multiple permission check (all)
 *
 * @param permissions - Array of permissions to check
 * @returns Boolean indicating if user has all of the permissions
 *
 * @example
 * ```tsx
 * const canFullyManageUsers = useAllPermissions(['users.create', 'users.edit', 'users.delete']);
 * ```
 */
export function useAllPermissions(permissions: string[]): boolean {
  const { user } = useAuth();
  return hasAllPermissions(user, permissions);
}

/**
 * Use multiple role check
 *
 * @param roles - Array of roles to check
 * @returns Boolean indicating if user has any of the roles
 *
 * @example
 * ```tsx
 * const isAdminOrManager = useAnyRole(['admin', 'manager']);
 * ```
 */
export function useAnyRole(roles: string[]): boolean {
  const { user } = useAuth();
  return hasAnyRole(user, roles);
}

/**
 * Use login handler
 *
 * Returns a memoized login function with loading state.
 *
 * @example
 * ```tsx
 * const { login, isLoading } = useLogin();
 *
 * const handleSubmit = async (data) => {
 *   await login(data);
 * };
 * ```
 */
export function useLogin() {
  const { login, isLoading } = useAuth();

  const handleLogin = useCallback(
    async (credentials: { username: string; password: string }) => {
      await login(credentials);
    },
    [login],
  );

  return {
    login: handleLogin,
    isLoading,
  };
}

/**
 * Use logout handler
 *
 * Returns a memoized logout function.
 *
 * @example
 * ```tsx
 * const logout = useLogout();
 *
 * <button onClick={logout}>Logout</button>
 * ```
 */
export function useLogout() {
  const { logout } = useAuth();
  return useCallback(() => logout(), [logout]);
}

/**
 * Use session refresh
 *
 * Returns a function to manually refresh the session.
 *
 * @example
 * ```tsx
 * const refreshSession = useRefreshSession();
 *
 * <button onClick={refreshSession}>Refresh Session</button>
 * ```
 */
export function useRefreshSession() {
  const { refreshSession } = useAuth();
  return useCallback(() => refreshSession(), [refreshSession]);
}
