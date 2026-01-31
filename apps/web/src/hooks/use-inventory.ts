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
// Mutation Hooks
// ============================================================================

/**
 * Create a new inventory item with stock
 */
export function useCreateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInventoryItemWithStock) =>
      inventoryApi.create(data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.statistics() });
      toast.success(`Item "${variables.name}" created successfully`);
      logger.info("Inventory item created:", result.id);
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

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: InventoryItemId;
      data: UpdateInventoryItem;
    }) => inventoryApi.update(id, data),
    onSuccess: (result, { id }) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.statistics() });
      toast.success("Inventory item updated successfully");
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

  return useMutation({
    mutationFn: (id: InventoryItemId) => inventoryApi.delete(id),
    onSuccess: (result, id) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.statistics() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lowStock() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.outOfStock() });
      toast.success("Inventory item deleted successfully");
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

  return useMutation({
    mutationFn: (id: InventoryItemId) => inventoryApi.restore(id),
    onSuccess: (result, id) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.statistics() });
      toast.success("Inventory item restored successfully");
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

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: InventoryItemId;
      data: UpdateInventoryStock;
    }) => inventoryApi.updateStock(id, data),
    onSuccess: (result, { id }) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.statistics() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lowStock() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.outOfStock() });
      toast.success("Stock updated successfully");
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

  return useMutation({
    mutationFn: ({ id, data }: { id: InventoryItemId; data: AdjustStock }) =>
      inventoryApi.adjustStock(id, data),
    onSuccess: (result, { id, data }) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.statistics() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lowStock() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.outOfStock() });
      const action = data.adjustment > 0 ? "added to" : "removed from";
      toast.success(`Stock ${action} successfully`);
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
