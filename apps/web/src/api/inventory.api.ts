/**
 * Inventory API
 *
 * Provides type-safe access to inventory-related Tauri commands.
 * All functions handle both Tauri and browser environments gracefully.
 *
 * @module api/inventory
 */

import { z } from "zod";
import { invokeCommand } from "@/lib/tauri-api";
import { createLogger } from "@/lib/logger";

const logger = createLogger("InventoryAPI");

// ============================================================================
// Schemas
// ============================================================================

/**
 * Inventory item ID schema
 */
export const InventoryItemIdSchema = z.string().uuid();
export type InventoryItemId = z.infer<typeof InventoryItemIdSchema>;

/**
 * Barcode input schema for creating barcodes
 */
export const CreateBarcodeInputSchema = z.object({
  barcode: z.string().min(1),
  barcode_type: z.string().optional(),
  is_primary: z.boolean(),
  description: z.string().optional(),
});
export type CreateBarcodeInput = z.infer<typeof CreateBarcodeInputSchema>;

/**
 * Inventory item barcode response schema
 */
export const InventoryItemBarcodeResponseSchema = z.object({
  id: z.string().uuid(),
  inventory_item_id: z.string().uuid(),
  barcode: z.string(),
  barcode_type: z.string().nullable(),
  is_primary: z.boolean(),
  description: z.string().nullable(),
  created_at: z.string(),
  created_by: z.string().uuid().nullable(),
});
export type InventoryItemBarcodeResponse = z.infer<
  typeof InventoryItemBarcodeResponseSchema
>;

/**
 * Inventory item with stock response schema (matches backend InventoryItemWithStockResponse)
 */
export const InventoryItemWithStockResponseSchema = z.object({
  // Catalog fields
  id: InventoryItemIdSchema,
  name: z.string(),
  generic_name: z.string().nullable(),
  concentration: z.string(),
  form: z.string(),
  manufacturer_id: z.string().uuid().nullable(),
  manufacturer_name: z.string().nullable(),
  requires_prescription: z.boolean(),
  is_controlled: z.boolean(),
  storage_instructions: z.string().nullable(),
  notes: z.string().nullable(),
  is_active: z.boolean(),
  created_by: InventoryItemIdSchema.nullable(),
  updated_by: InventoryItemIdSchema.nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  // Stock fields
  stock_id: InventoryItemIdSchema,
  stock_quantity: z.number().int(),
  min_stock_level: z.number().int(),
  unit_price: z.number(),
  last_restocked_at: z.string().nullable(),
  stock_updated_at: z.string(),
  // Barcodes
  barcodes: z.array(InventoryItemBarcodeResponseSchema),
});
export type InventoryItemWithStockResponse = z.infer<
  typeof InventoryItemWithStockResponseSchema
>;

/**
 * Inventory item response schema (catalog only, matches backend InventoryItemResponse)
 */
export const InventoryItemResponseSchema = z.object({
  id: InventoryItemIdSchema,
  name: z.string(),
  generic_name: z.string().nullable(),
  concentration: z.string(),
  form: z.string(),
  manufacturer_id: z.string().uuid().nullable(),
  manufacturer_name: z.string().nullable(),
  requires_prescription: z.boolean(),
  is_controlled: z.boolean(),
  storage_instructions: z.string().nullable(),
  notes: z.string().nullable(),
  is_active: z.boolean(),
  created_by: InventoryItemIdSchema.nullable(),
  updated_by: InventoryItemIdSchema.nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  barcodes: z.array(InventoryItemBarcodeResponseSchema),
});
export type InventoryItemResponse = z.infer<typeof InventoryItemResponseSchema>;

/**
 * Inventory stock response schema (matches backend InventoryStockResponse)
 */
export const InventoryStockResponseSchema = z.object({
  id: InventoryItemIdSchema,
  inventory_item_id: InventoryItemIdSchema,
  stock_quantity: z.number().int(),
  min_stock_level: z.number().int(),
  unit_price: z.number(),
  last_restocked_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type InventoryStockResponse = z.infer<
  typeof InventoryStockResponseSchema
>;

/**
 * Create inventory item with stock DTO schema (matches backend CreateInventoryItemWithStock)
 */
export const CreateInventoryItemWithStockSchema = z.object({
  // Catalog fields
  name: z.string().min(1),
  generic_name: z.string().optional(),
  concentration: z.string().min(1),
  form: z.string().min(1),
  manufacturer_id: z.string().uuid().optional(),
  requires_prescription: z.boolean(),
  is_controlled: z.boolean(),
  storage_instructions: z.string().optional(),
  notes: z.string().optional(),
  barcodes: z.array(CreateBarcodeInputSchema).default([]),
  // Stock fields
  stock_quantity: z.number().int().nonnegative(),
  min_stock_level: z.number().int().nonnegative(),
  unit_price: z.number().nonnegative(),
});
export type CreateInventoryItemWithStock = z.infer<
  typeof CreateInventoryItemWithStockSchema
>;

/**
 * Update inventory item DTO schema (matches backend UpdateInventoryItem)
 */
export const UpdateInventoryItemSchema = z.object({
  name: z.string().min(1).optional(),
  generic_name: z.string().optional(),
  concentration: z.string().min(1).optional(),
  form: z.string().min(1).optional(),
  manufacturer_id: z.string().uuid().optional(),
  requires_prescription: z.boolean().optional(),
  is_controlled: z.boolean().optional(),
  storage_instructions: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().optional(),
  updated_by: InventoryItemIdSchema.optional(),
});
export type UpdateInventoryItem = z.infer<typeof UpdateInventoryItemSchema>;

/**
 * Update inventory stock DTO schema (matches backend UpdateInventoryStock)
 */
export const UpdateInventoryStockSchema = z.object({
  stock_quantity: z.number().int().nonnegative().optional(),
  min_stock_level: z.number().int().nonnegative().optional(),
  unit_price: z.number().nonnegative().optional(),
});
export type UpdateInventoryStock = z.infer<typeof UpdateInventoryStockSchema>;

/**
 * Mutation result schema
 */
export const MutationResultSchema = z.object({
  id: InventoryItemIdSchema,
});
export type MutationResult = z.infer<typeof MutationResultSchema>;

/**
 * Inventory statistics schema (matches backend InventoryStatistics)
 */
export const InventoryStatisticsSchema = z.object({
  total_items: z.number(),
  active_items: z.number(),
  inactive_items: z.number(),
  low_stock_count: z.number(),
  out_of_stock_count: z.number(),
  total_inventory_value: z.number(),
});
export type InventoryStatistics = z.infer<typeof InventoryStatisticsSchema>;

/**
 * Price history entry schema (matches backend PriceHistoryResponse)
 */
export const PriceHistoryEntrySchema = z.object({
  id: z.string().uuid(),
  inventory_item_id: z.string().uuid(),
  unit_price: z.number(),
  recorded_at: z.string(),
  changed_by: z.string().uuid().nullable().optional(),
  reason: z.string().nullable().optional(),
});
export type PriceHistoryEntry = z.infer<typeof PriceHistoryEntrySchema>;

/**
 * Price statistics schema (matches backend PriceStatistics)
 */
export const PriceStatisticsSchema = z.object({
  min_price: z.number(),
  max_price: z.number(),
  avg_price: z.number(),
  entry_count: z.number(),
});
export type PriceStatistics = z.infer<typeof PriceStatisticsSchema>;

/**
 * Stock adjustment type schema
 */
export const StockAdjustmentTypeSchema = z.enum([
  "manual_adjustment",
  "order_arrival",
  "sale",
  "damage",
  "expiry",
  "return",
  "transfer",
  "initial_stock",
]);
export type StockAdjustmentType = z.infer<typeof StockAdjustmentTypeSchema>;

/**
 * Adjust stock DTO schema (matches backend AdjustStock)
 */
export const AdjustStockSchema = z.object({
  adjustment: z.number().int(), // Positive for add, negative for subtract
  reason: z.string().optional(),
  adjustment_type: StockAdjustmentTypeSchema.optional(), // Stock adjustment type
});
export type AdjustStock = z.infer<typeof AdjustStockSchema>;

/**
 * Stock history entry schema (matches backend StockHistoryResponse)
 */
export const StockHistoryEntrySchema = z.object({
  id: z.string().uuid(),
  inventory_item_id: z.string().uuid(),
  adjustment_type: StockAdjustmentTypeSchema,
  quantity_before: z.number().int(),
  quantity_after: z.number().int(),
  adjustment_amount: z.number().int(),
  reason: z.string().nullable(),
  reference_id: z.string().uuid().nullable(),
  reference_type: z.string().nullable(),
  recorded_at: z.string(),
  recorded_by: z.string().uuid().nullable(),
});
export type StockHistoryEntry = z.infer<typeof StockHistoryEntrySchema>;

/**
 * Stock history statistics schema (matches backend StockHistoryStatistics)
 */
export const StockHistoryStatisticsSchema = z.object({
  total_adjustments: z.number(),
  total_added: z.number(),
  total_removed: z.number(),
  net_change: z.number(),
  most_common_adjustment_type: StockAdjustmentTypeSchema.nullable(),
});
export type StockHistoryStatistics = z.infer<
  typeof StockHistoryStatisticsSchema
>;

// ============================================================================
// CRUD Operations (Catalog + Stock Combined)
// ============================================================================

/**
 * Create a new inventory item with stock
 */
export async function createInventoryItem(
  data: CreateInventoryItemWithStock,
): Promise<MutationResult> {
  logger.info("Creating inventory item:", data.name);
  return invokeCommand("create_inventory_item", MutationResultSchema, {
    params: { data },
  });
}

/**
 * Get inventory item with stock by ID
 */
export async function getInventoryItem(
  id: InventoryItemId,
): Promise<InventoryItemWithStockResponse> {
  logger.info("Getting inventory item:", id);
  return invokeCommand(
    "get_inventory_item",
    InventoryItemWithStockResponseSchema,
    { params: { id } },
  );
}

/**
 * Get inventory item by barcode
 */
export async function getInventoryItemByBarcode(
  barcode: string,
): Promise<InventoryItemWithStockResponse> {
  logger.info("Getting inventory item by barcode:", barcode);
  return invokeCommand(
    "get_inventory_item_by_barcode",
    InventoryItemWithStockResponseSchema,
    { barcode },
  );
}

/**
 * Update inventory item (catalog only)
 */
export async function updateInventoryItem(
  id: InventoryItemId,
  data: UpdateInventoryItem,
): Promise<MutationResult> {
  logger.info("Updating inventory item:", id);
  return invokeCommand("update_inventory_item", MutationResultSchema, {
    params: { id, data },
  });
}

/**
 * Delete inventory item (soft delete)
 */
export async function deleteInventoryItem(
  id: InventoryItemId,
): Promise<MutationResult> {
  logger.info("Deleting inventory item:", id);
  return invokeCommand("delete_inventory_item", MutationResultSchema, {
    params: { id },
  });
}

/**
 * Restore soft-deleted inventory item
 */
export async function restoreInventoryItem(
  id: InventoryItemId,
): Promise<MutationResult> {
  logger.info("Restoring inventory item:", id);
  return invokeCommand("restore_inventory_item", MutationResultSchema, {
    params: { id },
  });
}

// ============================================================================
// Stock Management Operations
// ============================================================================

/**
 * Update stock (set absolute values)
 */
export async function updateInventoryStock(
  id: InventoryItemId,
  data: UpdateInventoryStock,
): Promise<MutationResult> {
  logger.info("Updating stock for item:", id);
  return invokeCommand("update_inventory_stock", MutationResultSchema, {
    params: { id, data },
  });
}

/**
 * Adjust stock (add or subtract)
 */
export async function adjustInventoryStock(
  id: InventoryItemId,
  data: AdjustStock,
): Promise<MutationResult> {
  logger.info(
    `Adjusting stock for item: ${id}, adjustment: ${data.adjustment}`,
  );
  return invokeCommand("adjust_inventory_stock", MutationResultSchema, {
    params: { id, data },
  });
}

// ============================================================================
// Listing & Filtering Operations
// ============================================================================

/**
 * List all active inventory items with stock
 */
export async function listActiveInventoryItems(): Promise<
  InventoryItemWithStockResponse[]
> {
  logger.info("Listing active inventory items");
  return invokeCommand(
    "list_active_inventory_items",
    z.array(InventoryItemWithStockResponseSchema),
    {},
  );
}

/**
 * Get low stock items
 */
export async function getLowStockItems(): Promise<
  InventoryItemWithStockResponse[]
> {
  logger.info("Getting low stock items");
  return invokeCommand(
    "get_low_stock_items",
    z.array(InventoryItemWithStockResponseSchema),
    {},
  );
}

/**
 * Get out of stock items
 */
export async function getOutOfStockItems(): Promise<
  InventoryItemWithStockResponse[]
> {
  logger.info("Getting out of stock items");
  return invokeCommand(
    "get_out_of_stock_items",
    z.array(InventoryItemWithStockResponseSchema),
    {},
  );
}

/**
 * Search inventory items by name, generic name, or barcode
 */
export async function searchInventoryItems(
  searchTerm: string,
): Promise<InventoryItemWithStockResponse[]> {
  logger.info("Searching inventory items:", searchTerm);
  return invokeCommand(
    "search_inventory_items",
    z.array(InventoryItemWithStockResponseSchema),
    { search_term: searchTerm },
  );
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get inventory statistics
 */
export async function getInventoryStatistics(): Promise<InventoryStatistics> {
  logger.info("Getting inventory statistics");
  return invokeCommand(
    "get_inventory_statistics",
    InventoryStatisticsSchema,
    {},
  );
}

// ============================================================================
// Price History Operations
// ============================================================================

/**
 * Get price history for an inventory item
 */
export async function getPriceHistory(
  id: InventoryItemId,
  limit?: number,
): Promise<PriceHistoryEntry[]> {
  logger.info("Getting price history for item:", { id, limit });
  return invokeCommand("get_price_history", z.array(PriceHistoryEntrySchema), {
    params: {
      filter: {
        inventory_item_id: id,
        limit: limit,
      },
    },
  });
}

/**
 * Get the latest price for an inventory item
 */
export async function getLatestPrice(
  id: InventoryItemId,
): Promise<PriceHistoryEntry | null> {
  logger.info("Getting latest price for item:", id);
  return invokeCommand("get_latest_price", PriceHistoryEntrySchema.nullable(), {
    params: { id },
  });
}

/**
 * Get price statistics for an inventory item
 */
export async function getPriceStatistics(
  id: InventoryItemId,
): Promise<PriceStatistics> {
  logger.info("Getting price statistics for item:", id);
  return invokeCommand("get_price_statistics", PriceStatisticsSchema, {
    params: { id },
  });
}

// ============================================================================
// Barcode Management Operations
// ============================================================================

/**
 * Get all barcodes for an inventory item
 */
export async function getItemBarcodes(
  itemId: InventoryItemId,
): Promise<InventoryItemBarcodeResponse[]> {
  logger.info("Getting barcodes for item:", itemId);
  return invokeCommand(
    "get_item_barcodes",
    z.array(InventoryItemBarcodeResponseSchema),
    { params: { item_id: itemId } },
  );
}

/**
 * Add a barcode to an inventory item
 */
export async function addBarcode(
  itemId: InventoryItemId,
  data: CreateBarcodeInput,
): Promise<MutationResult> {
  logger.info("Adding barcode to item:", itemId);
  return invokeCommand("add_barcode", MutationResultSchema, {
    params: { item_id: itemId, data },
  });
}

/**
 * Remove a barcode from an inventory item
 */
export async function removeBarcode(
  barcodeId: string,
): Promise<MutationResult> {
  logger.info("Removing barcode:", barcodeId);
  return invokeCommand("remove_barcode", MutationResultSchema, {
    params: { barcode_id: barcodeId },
  });
}

/**
 * Set a barcode as primary for an inventory item
 */
export async function setPrimaryBarcode(
  itemId: InventoryItemId,
  barcodeId: string,
): Promise<MutationResult> {
  logger.info("Setting primary barcode:", { itemId, barcodeId });
  return invokeCommand("set_primary_barcode", MutationResultSchema, {
    params: { id: itemId, data: { barcode_id: barcodeId } },
  });
}

/**
 * Update a barcode
 */
export async function updateBarcode(
  barcodeId: string,
  data: Partial<CreateBarcodeInput>,
): Promise<MutationResult> {
  logger.info("Updating barcode:", barcodeId);
  return invokeCommand("update_barcode", MutationResultSchema, {
    params: { barcode_id: barcodeId, data },
  });
}

// ============================================================================
// Stock History Operations
// ============================================================================

/**
 * Get stock history for an inventory item
 */
export async function getStockHistory(
  id: InventoryItemId,
  limit?: number,
): Promise<StockHistoryEntry[]> {
  logger.info("Getting stock history for item:", { id, limit });
  return invokeCommand("get_stock_history", z.array(StockHistoryEntrySchema), {
    params: {
      filter: {
        inventory_item_id: id,
        limit: limit,
      },
    },
  });
}

/**
 * Get the latest stock adjustment for an inventory item
 */
export async function getLatestStockAdjustment(
  id: InventoryItemId,
): Promise<StockHistoryEntry | null> {
  logger.info("Getting latest stock adjustment for item:", id);
  return invokeCommand(
    "get_latest_stock_adjustment",
    StockHistoryEntrySchema.nullable(),
    {
      params: { id },
    },
  );
}

/**
 * Get stock history statistics for an inventory item
 */
export async function getStockHistoryStatistics(
  id: InventoryItemId,
): Promise<StockHistoryStatistics> {
  logger.info("Getting stock history statistics for item:", id);
  return invokeCommand(
    "get_stock_history_statistics",
    StockHistoryStatisticsSchema,
    {
      params: { id },
    },
  );
}

// ============================================================================
// Exports
// ============================================================================

export const inventoryApi = {
  // CRUD
  create: createInventoryItem,
  get: getInventoryItem,
  getByBarcode: getInventoryItemByBarcode,
  update: updateInventoryItem,
  delete: deleteInventoryItem,
  restore: restoreInventoryItem,

  // Stock Management
  updateStock: updateInventoryStock,
  adjustStock: adjustInventoryStock,

  // Listing & Filtering
  listActive: listActiveInventoryItems,
  getLowStock: getLowStockItems,
  getOutOfStock: getOutOfStockItems,
  search: searchInventoryItems,

  // Statistics
  getStatistics: getInventoryStatistics,

  // Price History
  getPriceHistory: getPriceHistory,
  getLatestPrice: getLatestPrice,
  getPriceStatistics: getPriceStatistics,

  // Stock History
  getStockHistory: getStockHistory,
  getLatestStockAdjustment: getLatestStockAdjustment,
  getStockHistoryStatistics: getStockHistoryStatistics,

  // Barcode Management
  getBarcodes: getItemBarcodes,
  addBarcode: addBarcode,
  removeBarcode: removeBarcode,
  setPrimaryBarcode: setPrimaryBarcode,
  updateBarcode: updateBarcode,
} as const;
