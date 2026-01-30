/**
 * TanStack Query Hooks for Onboarding
 *
 * Professional reactive hooks using TanStack Query for onboarding and first-run setup.
 * Provides type-safe access to onboarding operations with automatic cache management.
 *
 * @module hooks/use-onboarding-db
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";
import { type LoginResponse } from "@/api/user.api";
import { onboardingApi, type FirstRunSetup } from "@/api/onboarding.api";

const logger = createLogger("OnboardingDB");

// ============================================================================
// Query Keys
// ============================================================================

export const onboardingKeys = {
  all: ["onboarding"] as const,
  firstRun: ["onboarding", "first-run"] as const,
} as const;

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Check if this is the first run of the application
 *
 * Returns true if no users exist and config indicates first run.
 * Automatically refetches on window focus and mount.
 *
 * @example
 * ```tsx
 * const { data: isFirstRun, isLoading } = useCheckFirstRun();
 *
 * if (isFirstRun) {
 *   return <OnboardingPage />;
 * }
 * ```
 */
export function useCheckFirstRun() {
  return useQuery({
    queryKey: onboardingKeys.firstRun,
    queryFn: async () => {
      try {
        logger.info("Checking first-run status");
        const isFirstRun = await onboardingApi.checkFirstRun();
        logger.info("First-run status:", isFirstRun);
        return isFirstRun;
      } catch (error) {
        logger.error("Failed to check first-run status:", error);
        // Don't show toast for this error as it might be expected
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Complete first-run setup with custom admin credentials
 *
 * Creates the initial admin user, logs them in automatically,
 * and marks first-run as complete.
 *
 * @example
 * ```tsx
 * const completeSetup = useCompleteFirstRunSetup();
 *
 * completeSetup.mutate(setupData, {
 *   onSuccess: (response) => {
 *     // User is now logged in
 *     navigate('/');
 *   },
 * });
 * ```
 */
export function useCompleteFirstRunSetup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FirstRunSetup): Promise<LoginResponse> => {
      try {
        logger.info("Completing first-run setup for user:", data.username);
        const response = await onboardingApi.completeSetup(data);
        logger.info("First-run setup completed successfully");
        return response;
      } catch (error) {
        logger.error("Failed to complete first-run setup:", error);
        throw error;
      }
    },
    onSuccess: (response) => {
      // Mark first-run as complete in cache
      queryClient.setQueryData(onboardingKeys.firstRun, false);

      // Invalidate all queries to refresh app state
      queryClient.invalidateQueries();

      toast.success(
        `Welcome, ${response.user.first_name}! Your account has been created.`,
      );
    },
    onError: (error: Error) => {
      logger.error("First-run setup error:", error);
      toast.error(
        `Failed to complete setup: ${error.message || "Unknown error"}`,
      );
    },
  });
}

/**
 * Complete first-run setup with default credentials
 *
 * Creates an admin user with default credentials (admin/admin123).
 * Useful for automated testing or development environments.
 *
 * @example
 * ```tsx
 * const completeSetupDefault = useCompleteFirstRunSetupDefault();
 *
 * completeSetupDefault.mutate(undefined, {
 *   onSuccess: () => {
 *     navigate('/');
 *   },
 * });
 * ```
 */
export function useCompleteFirstRunSetupDefault() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<LoginResponse> => {
      try {
        logger.info("Completing first-run setup with default credentials");
        const response = await onboardingApi.completeSetupDefault();
        logger.info("First-run setup with defaults completed successfully");
        return response;
      } catch (error) {
        logger.error(
          "Failed to complete first-run setup with defaults:",
          error,
        );
        throw error;
      }
    },
    onSuccess: (response) => {
      // Mark first-run as complete in cache
      queryClient.setQueryData(onboardingKeys.firstRun, false);

      // Invalidate all queries to refresh app state
      queryClient.invalidateQueries();

      toast.success(
        `Welcome, ${response.user.first_name}! Default admin account created.`,
      );
    },
    onError: (error: Error) => {
      logger.error("First-run setup with defaults error:", error);
      toast.error(
        `Failed to complete setup: ${error.message || "Unknown error"}`,
      );
    },
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Refresh first-run status from backend
 *
 * Useful for manually checking if setup is still needed.
 *
 * @example
 * ```tsx
 * const refreshFirstRun = useRefreshFirstRun();
 *
 * <button onClick={refreshFirstRun}>Check Setup Status</button>
 * ```
 */
export function useRefreshFirstRun() {
  const queryClient = useQueryClient();

  return () => {
    logger.info("Manually refreshing first-run status");
    queryClient.invalidateQueries({ queryKey: onboardingKeys.firstRun });
  };
}

/**
 * Reset first-run status in cache
 *
 * Useful for testing or development. Does not affect backend state.
 *
 * @example
 * ```tsx
 * const resetFirstRun = useResetFirstRunCache();
 *
 * <button onClick={() => resetFirstRun(true)}>
 *   Simulate First Run
 * </button>
 * ```
 */
export function useResetFirstRunCache() {
  const queryClient = useQueryClient();

  return (isFirstRun: boolean) => {
    logger.info("Resetting first-run cache to:", isFirstRun);
    queryClient.setQueryData(onboardingKeys.firstRun, isFirstRun);
  };
}
