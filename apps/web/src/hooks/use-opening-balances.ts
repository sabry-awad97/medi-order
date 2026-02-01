/**
 * Opening Balance Hooks
 *
 * React Query hooks for opening balance management.
 * Provides type-safe access to opening balance operations with automatic cache management.
 *
 * @module hooks/use-opening-balances
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "@meditrack/i18n";
import { openingBalanceApi } from "@/api/opening-balance.api";
import { createLogger } from "@/lib/logger";
import type {
  OpeningBalanceId,
  CreateOpeningBalance,
  UpdateOpeningBalance,
  CreateAdjustment,
  OpeningBalanceQuery,
} from "@/api/opening-balance.api";
import type { PaginationParams } from "@/lib/tauri-api";

const logger = createLogger("OpeningBalanceHooks");

// ============================================================================
// Query Keys
// ============================================================================

export const openingBalanceKeys = {
  all: ["openingBalance"] as const,
  lists: () => [...openingBalanceKeys.all, "list"] as const,
  list: (filter?: OpeningBalanceQuery, pagination?: PaginationParams) =>
    [...openingBalanceKeys.lists(), filter, pagination] as const,
  details: () => [...openingBalanceKeys.all, "detail"] as const,
  detail: (id: OpeningBalanceId) =>
    [...openingBalanceKeys.details(), id] as const,
  byItem: (inventoryItemId: string) =>
    [...openingBalanceKeys.all, "byItem", inventoryItemId] as const,
  unverified: () => [...openingBalanceKeys.all, "unverified"] as const,
  byBatch: (batchId: string) =>
    [...openingBalanceKeys.all, "byBatch", batchId] as const,
  statistics: () => [...openingBalanceKeys.all, "statistics"] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * List opening balance entries with filtering and pagination
 */
export function useOpeningBalances(
  filter?: OpeningBalanceQuery,
  pagination?: PaginationParams,
) {
  return useQuery({
    queryKey: openingBalanceKeys.list(filter, pagination),
    queryFn: () => openingBalanceApi.list(filter, pagination),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Get a single opening balance entry by ID
 */
export function useOpeningBalance(
  id: OpeningBalanceId,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: openingBalanceKeys.detail(id),
    queryFn: () => openingBalanceApi.get(id),
    enabled: options?.enabled ?? !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Get all opening balance entries for a specific inventory item
 */
export function useOpeningBalancesByItem(
  inventoryItemId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: openingBalanceKeys.byItem(inventoryItemId),
    queryFn: () => openingBalanceApi.getByItem(inventoryItemId),
    enabled: options?.enabled ?? !!inventoryItemId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Get all unverified opening balance entries
 */
export function useUnverifiedOpeningBalances() {
  return useQuery({
    queryKey: openingBalanceKeys.unverified(),
    queryFn: () => openingBalanceApi.getUnverified(),
    staleTime: 1000 * 30, // 30 seconds (more frequent updates for pending items)
  });
}

/**
 * Get opening balance entries by import batch ID
 */
export function useOpeningBalancesByBatch(
  batchId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: openingBalanceKeys.byBatch(batchId),
    queryFn: () => openingBalanceApi.getByBatch(batchId),
    enabled: options?.enabled ?? !!batchId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get opening balance statistics
 */
export function useOpeningBalanceStatistics() {
  return useQuery({
    queryKey: openingBalanceKeys.statistics(),
    queryFn: () => openingBalanceApi.getStatistics(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new opening balance entry
 */
export function useCreateOpeningBalance() {
  const queryClient = useQueryClient();
  const { t } = useTranslation("inventory");

  return useMutation({
    mutationFn: ({
      data,
      entered_by,
    }: {
      data: CreateOpeningBalance;
      entered_by: string;
    }) => openingBalanceApi.create(data, entered_by),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: openingBalanceKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: openingBalanceKeys.byItem(variables.data.inventory_item_id),
      });
      queryClient.invalidateQueries({
        queryKey: openingBalanceKeys.statistics(),
      });
      queryClient.invalidateQueries({
        queryKey: openingBalanceKeys.unverified(),
      });
      // Also invalidate inventory queries since stock is affected
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success(t("messages.openingBalanceCreated"));
      logger.info("Opening balance created:", _result.id);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create opening balance: ${error.message}`);
      logger.error("Failed to create opening balance:", error);
    },
  });
}

/**
 * Update an existing opening balance entry
 */
export function useUpdateOpeningBalance() {
  const queryClient = useQueryClient();
  const { t } = useTranslation("inventory");

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: OpeningBalanceId;
      data: UpdateOpeningBalance;
    }) => openingBalanceApi.update(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: openingBalanceKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: openingBalanceKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: openingBalanceKeys.statistics(),
      });
      // Also invalidate inventory queries since stock might be affected
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success(t("messages.openingBalanceUpdated"));
      logger.info("Opening balance updated:", id);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update opening balance: ${error.message}`);
      logger.error("Failed to update opening balance:", error);
    },
  });
}

/**
 * Delete an opening balance entry (soft delete via rejection)
 */
export function useDeleteOpeningBalance() {
  const queryClient = useQueryClient();
  const { t } = useTranslation("inventory");

  return useMutation({
    mutationFn: ({ id, reason }: { id: OpeningBalanceId; reason: string }) =>
      openingBalanceApi.delete(id, reason),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: openingBalanceKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: openingBalanceKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: openingBalanceKeys.statistics(),
      });
      queryClient.invalidateQueries({
        queryKey: openingBalanceKeys.unverified(),
      });
      // Also invalidate inventory queries since stock is affected
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success(t("messages.openingBalanceDeleted"));
      logger.info("Opening balance deleted:", id);
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete opening balance: ${error.message}`);
      logger.error("Failed to delete opening balance:", error);
    },
  });
}

// ============================================================================
// Verification Workflow Mutation Hooks
// ============================================================================

/**
 * Verify an opening balance entry
 */
export function useVerifyOpeningBalance() {
  const queryClient = useQueryClient();
  const { t } = useTranslation("inventory");

  return useMutation({
    mutationFn: ({
      id,
      verified_by,
    }: {
      id: OpeningBalanceId;
      verified_by: string;
    }) => openingBalanceApi.verify(id, verified_by),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: openingBalanceKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: openingBalanceKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: openingBalanceKeys.statistics(),
      });
      queryClient.invalidateQueries({
        queryKey: openingBalanceKeys.unverified(),
      });
      // Also invalidate inventory queries since stock is now verified
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success(t("messages.openingBalanceVerified"));
      logger.info("Opening balance verified:", id);
    },
    onError: (error: Error) => {
      toast.error(`Failed to verify opening balance: ${error.message}`);
      logger.error("Failed to verify opening balance:", error);
    },
  });
}

/**
 * Reject an opening balance entry
 */
export function useRejectOpeningBalance() {
  const queryClient = useQueryClient();
  const { t } = useTranslation("inventory");

  return useMutation({
    mutationFn: ({ id, reason }: { id: OpeningBalanceId; reason: string }) =>
      openingBalanceApi.reject(id, reason),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: openingBalanceKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: openingBalanceKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: openingBalanceKeys.statistics(),
      });
      queryClient.invalidateQueries({
        queryKey: openingBalanceKeys.unverified(),
      });
      // Also invalidate inventory queries since stock is affected
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success(t("messages.openingBalanceRejected"));
      logger.info("Opening balance rejected:", id);
    },
    onError: (error: Error) => {
      toast.error(`Failed to reject opening balance: ${error.message}`);
      logger.error("Failed to reject opening balance:", error);
    },
  });
}

// ============================================================================
// Adjustment Mutation Hooks
// ============================================================================

/**
 * Create an adjustment to an opening balance entry
 */
export function useCreateOpeningBalanceAdjustment() {
  const queryClient = useQueryClient();
  const { t } = useTranslation("inventory");

  return useMutation({
    mutationFn: ({
      data,
      entered_by,
    }: {
      data: CreateAdjustment;
      entered_by: string;
    }) => openingBalanceApi.createAdjustment(data, entered_by),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: openingBalanceKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: openingBalanceKeys.detail(variables.data.original_balance_id),
      });
      queryClient.invalidateQueries({
        queryKey: openingBalanceKeys.statistics(),
      });
      // Also invalidate inventory queries since stock is affected
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success(t("messages.openingBalanceAdjustmentCreated"));
      logger.info("Opening balance adjustment created:", _result.id);
    },
    onError: (error: Error) => {
      toast.error(
        `Failed to create opening balance adjustment: ${error.message}`,
      );
      logger.error("Failed to create opening balance adjustment:", error);
    },
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Prefetch opening balance data for better UX
 */
export function usePrefetchOpeningBalance() {
  const queryClient = useQueryClient();

  return (id: OpeningBalanceId) => {
    queryClient.prefetchQuery({
      queryKey: openingBalanceKeys.detail(id),
      queryFn: () => openingBalanceApi.get(id),
      staleTime: 1000 * 60 * 2,
    });
  };
}

/**
 * Invalidate all opening balance queries
 */
export function useInvalidateOpeningBalances() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: openingBalanceKeys.all });
    logger.info("All opening balance queries invalidated");
  };
}
