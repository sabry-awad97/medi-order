/**
 * Inventory Hooks
 *
 * React Query hooks for inventory management.
 * Provides type-safe access to inventory operations with automatic cache management.
 *
 * @module hooks/use-inventory
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "@meditrack/i18n";
import { inventoryApi } from "@/api/inventory.api";
import { createLogger } from "@/lib/logger";
import type {
  InventoryItemId,
  CreateInventoryItemWithStock,
  UpdateInventoryItem,
  UpdateInventoryStock,
  AdjustStock,
} from "@/api/inventory.api";

const logger = createLogger("InventoryHooks");

// ============================================================================
// Query Keys
// ============================================================================

export const inventoryKeys = {
  all: ["inventory"] as const,
  lists: () => [...inventoryKeys.all, "list"] as const,
  listActive: () => [...inventoryKeys.lists(), "active"] as const,
  details: () => [...inventoryKeys.all, "detail"] as const,
  detail: (id: InventoryItemId) => [...inventoryKeys.details(), id] as const,
  byBarcode: (barcode: string) =>
    [...inventoryKeys.all, "barcode", barcode] as const,
  search: (searchTerm: string) =>
    [...inventoryKeys.all, "search", searchTerm] as const,
  statistics: () => [...inventoryKeys.all, "statistics"] as const,
  lowStock: () => [...inventoryKeys.all, "lowStock"] as const,
  outOfStock: () => [...inventoryKeys.all, "outOfStock"] as const,
  priceHistory: (id: InventoryItemId, limit?: number) =>
    [...inventoryKeys.all, "priceHistory", id, limit] as const,
  latestPrice: (id: InventoryItemId) =>
    [...inventoryKeys.all, "latestPrice", id] as const,
  priceStatistics: (id: InventoryItemId) =>
    [...inventoryKeys.all, "priceStatistics", id] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get all active inventory items with stock
 */
export function useInventoryItems() {
  return useQuery({
    queryKey: inventoryKeys.listActive(),
    queryFn: () => inventoryApi.listActive(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get a single inventory item by ID
 */
export function useInventoryItem(
  id: InventoryItemId,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: inventoryKeys.detail(id),
    queryFn: () => inventoryApi.get(id),
    enabled: options?.enabled ?? !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get inventory item by barcode
 */
export function useInventoryItemByBarcode(
  barcode: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: inventoryKeys.byBarcode(barcode),
    queryFn: () => inventoryApi.getByBarcode(barcode),
    enabled: (options?.enabled ?? true) && barcode.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Search inventory items
 */
export function useSearchInventoryItems(
  searchTerm: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: inventoryKeys.search(searchTerm),
    queryFn: () => inventoryApi.search(searchTerm),
    enabled: (options?.enabled ?? true) && searchTerm.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Get inventory statistics
 */
export function useInventoryStatistics() {
  return useQuery({
    queryKey: inventoryKeys.statistics(),
    queryFn: () => inventoryApi.getStatistics(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Get low stock items
 */
export function useLowStockItems() {
  return useQuery({
    queryKey: inventoryKeys.lowStock(),
    queryFn: () => inventoryApi.getLowStock(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Get out of stock items
 */
export function useOutOfStockItems() {
  return useQuery({
    queryKey: inventoryKeys.outOfStock(),
    queryFn: () => inventoryApi.getOutOfStock(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// ============================================================================
// Price History Query Hooks
// ============================================================================

/**
 * Get price history for an inventory item
 */
export function usePriceHistory(
  id: InventoryItemId,
  limit?: number,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: inventoryKeys.priceHistory(id, limit),
    queryFn: () => inventoryApi.getPriceHistory(id, limit),
    enabled: options?.enabled ?? !!id,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Get the latest price for an inventory item
 */
export function useLatestPrice(
  id: InventoryItemId,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: inventoryKeys.latestPrice(id),
    queryFn: () => inventoryApi.getLatestPrice(id),
    enabled: options?.enabled ?? !!id,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Get price statistics for an inventory item
 */
export function usePriceStatistics(
  id: InventoryItemId,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: inventoryKeys.priceStatistics(id),
    queryFn: () => inventoryApi.getPriceStatistics(id),
    enabled: options?.enabled ?? !!id,
    staleTime: 1000 * 30, // 30 seconds
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new inventory item with stock
 */
export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  const { t } = useTranslation("inventory");

  return useMutation({
    mutationFn: (data: CreateInventoryItemWithStock) =>
      inventoryApi.create(data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.statistics() });
      toast.success(t("messages.itemCreated", { name: variables.name }));
      logger.info("Inventory item created:", _result.id);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create item: ${error.message}`);
      logger.error("Failed to create inventory item:", error);
    },
  });
}

/**
 * Update an existing inventory item (catalog only)
 */
export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  const { t } = useTranslation("inventory");

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: InventoryItemId;
      data: UpdateInventoryItem;
    }) => inventoryApi.update(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.statistics() });
      toast.success(t("messages.itemUpdated"));
      logger.info("Inventory item updated:", id);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update item: ${error.message}`);
      logger.error("Failed to update inventory item:", error);
    },
  });
}

/**
 * Delete an inventory item (soft delete)
 */
export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();
  const { t } = useTranslation("inventory");

  return useMutation({
    mutationFn: (id: InventoryItemId) => inventoryApi.delete(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.statistics() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lowStock() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.outOfStock() });
      toast.success(t("messages.itemDeleted"));
      logger.info("Inventory item deleted:", id);
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete item: ${error.message}`);
      logger.error("Failed to delete inventory item:", error);
    },
  });
}

/**
 * Restore a soft-deleted inventory item
 */
export function useRestoreInventoryItem() {
  const queryClient = useQueryClient();
  const { t } = useTranslation("inventory");

  return useMutation({
    mutationFn: (id: InventoryItemId) => inventoryApi.restore(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.statistics() });
      toast.success(t("messages.itemRestored"));
      logger.info("Inventory item restored:", id);
    },
    onError: (error: Error) => {
      toast.error(`Failed to restore item: ${error.message}`);
      logger.error("Failed to restore inventory item:", error);
    },
  });
}

/**
 * Update stock (set absolute values)
 */
export function useUpdateInventoryStock() {
  const queryClient = useQueryClient();
  const { t } = useTranslation("inventory");

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: InventoryItemId;
      data: UpdateInventoryStock;
    }) => inventoryApi.updateStock(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.statistics() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lowStock() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.outOfStock() });
      // Invalidate price history if price was updated
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.priceHistory(id),
      });
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.latestPrice(id),
      });
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.priceStatistics(id),
      });
      toast.success(t("messages.stockUpdated"));
      logger.info("Stock updated for item:", id);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update stock: ${error.message}`);
      logger.error("Failed to update stock:", error);
    },
  });
}

/**
 * Adjust stock (add or subtract)
 */
export function useAdjustInventoryStock() {
  const queryClient = useQueryClient();
  const { t } = useTranslation("inventory");

  return useMutation({
    mutationFn: ({ id, data }: { id: InventoryItemId; data: AdjustStock }) =>
      inventoryApi.adjustStock(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.statistics() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lowStock() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.outOfStock() });
      toast.success(t("messages.stockAdjusted"));
      logger.info("Stock adjusted for item:", id);
    },
    onError: (error: Error) => {
      toast.error(`Failed to adjust stock: ${error.message}`);
      logger.error("Failed to adjust stock:", error);
    },
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Prefetch inventory item data for better UX
 */
export function usePrefetchInventoryItem() {
  const queryClient = useQueryClient();

  return (id: InventoryItemId) => {
    queryClient.prefetchQuery({
      queryKey: inventoryKeys.detail(id),
      queryFn: () => inventoryApi.get(id),
      staleTime: 1000 * 60 * 5,
    });
  };
}

/**
 * Invalidate all inventory queries
 */
export function useInvalidateInventory() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    logger.info("All inventory queries invalidated");
  };
}
