/**
 * Opening Balance API
 *
 * Provides type-safe access to opening balance-related Tauri commands.
 * All functions handle both Tauri and browser environments gracefully.
 *
 * @module api/opening-balance
 */

import { z } from "zod";
import { invokeCommand, type PaginationParams } from "@/lib/tauri-api";
import { createLogger } from "@/lib/logger";

const logger = createLogger("OpeningBalanceAPI");

// ============================================================================
// Schemas
// ============================================================================

/**
 * Opening balance ID schema
 */
export const OpeningBalanceIdSchema = z.string().uuid();
export type OpeningBalanceId = z.infer<typeof OpeningBalanceIdSchema>;

/**
 * Opening balance entry type enum
 */
export const OpeningBalanceEntryTypeSchema = z.enum([
  "initial",
  "adjustment",
  "correction",
  "reconciliation",
]);
export type OpeningBalanceEntryType = z.infer<
  typeof OpeningBalanceEntryTypeSchema
>;

/**
 * Opening balance response schema (matches backend OpeningBalanceResponse)
 */
export const OpeningBalanceResponseSchema = z.object({
  id: OpeningBalanceIdSchema,
  inventory_item_id: z.string().uuid(),
  inventory_item_name: z.string(),
  quantity: z.number().int().nonnegative(),
  unit_price: z.number().nonnegative(),
  total_value: z.number().nonnegative(),
  batch_number: z.string().nullable(),
  expiry_date: z.string().nullable(),
  entry_date: z.string(),
  entry_type: OpeningBalanceEntryTypeSchema,
  reason: z.string().nullable(),
  notes: z.string().nullable(),
  entered_by: z.string().uuid(),
  entered_by_name: z.string(),
  is_verified: z.boolean(),
  verified_by: z.string().uuid().nullable(),
  verified_by_name: z.string().nullable(),
  verified_at: z.string().nullable(),
  import_batch_id: z.string().uuid().nullable(),
  import_file_name: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type OpeningBalanceResponse = z.infer<
  typeof OpeningBalanceResponseSchema
>;

/**
 * Create opening balance DTO schema (matches backend CreateOpeningBalanceDto)
 */
export const CreateOpeningBalanceSchema = z.object({
  inventory_item_id: z.string().uuid(),
  quantity: z.number().int().nonnegative(),
  unit_price: z.number().nonnegative(),
  batch_number: z.string().optional(),
  expiry_date: z.string().optional(),
  entry_date: z.string(),
  entry_type: OpeningBalanceEntryTypeSchema,
  reason: z.string().optional(),
  notes: z.string().optional(),
  import_batch_id: z.string().uuid().optional(),
  import_file_name: z.string().optional(),
  adjusted_from_id: z.string().uuid().optional(),
});
export type CreateOpeningBalance = z.infer<typeof CreateOpeningBalanceSchema>;

/**
 * Update opening balance DTO schema (matches backend UpdateOpeningBalanceDto)
 */
export const UpdateOpeningBalanceSchema = z.object({
  quantity: z.number().int().nonnegative().optional(),
  unit_price: z.number().nonnegative().optional(),
  batch_number: z.string().optional(),
  expiry_date: z.string().optional(),
  entry_date: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});
export type UpdateOpeningBalance = z.infer<typeof UpdateOpeningBalanceSchema>;

/**
 * Create adjustment DTO schema (matches backend CreateAdjustmentDto)
 */
export const CreateAdjustmentSchema = z.object({
  original_balance_id: z.string().uuid(),
  quantity: z.number().int().nonnegative(),
  unit_price: z.number().nonnegative(),
  reason: z.string(),
  notes: z.string().optional(),
});
export type CreateAdjustment = z.infer<typeof CreateAdjustmentSchema>;

/**
 * Opening balance query filters schema (matches backend OpeningBalanceQueryDto)
 */
export const OpeningBalanceQuerySchema = z.object({
  inventory_item_id: z.string().uuid().optional(),
  entry_type: OpeningBalanceEntryTypeSchema.optional(),
  is_verified: z.boolean().optional(),
  is_active: z.boolean().optional(),
  import_batch_id: z.string().uuid().optional(),
  entry_date_from: z.string().optional(),
  entry_date_to: z.string().optional(),
});
export type OpeningBalanceQuery = z.infer<typeof OpeningBalanceQuerySchema>;

/**
 * Opening balance statistics schema (matches backend OpeningBalanceStatistics)
 */
export const OpeningBalanceStatisticsSchema = z.object({
  total_entries: z.number(),
  verified_entries: z.number(),
  pending_verification: z.number(),
  items_with_opening_balance: z.number(),
  total_value: z.number(),
  latest_entry_date: z.string().nullable(),
  entries_by_type: z.object({
    initial: z.number(),
    adjustment: z.number(),
    correction: z.number(),
    reconciliation: z.number(),
  }),
});
export type OpeningBalanceStatistics = z.infer<
  typeof OpeningBalanceStatisticsSchema
>;

/**
 * Pagination result schema
 */
export const PaginationResultSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    page_size: z.number(),
    total_pages: z.number(),
  });
export type PaginationResult<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

/**
 * Mutation result schema
 */
export const MutationResultSchema = z.object({
  id: OpeningBalanceIdSchema,
});
export type MutationResult = z.infer<typeof MutationResultSchema>;

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Create a new opening balance entry
 */
export async function createOpeningBalance(
  data: CreateOpeningBalance,
  entered_by: string,
): Promise<MutationResult> {
  logger.info("Creating opening balance for item:", data.inventory_item_id);
  return invokeCommand("create_opening_balance", MutationResultSchema, {
    params: { data: [data, entered_by] },
  });
}

/**
 * Get opening balance entry by ID
 */
export async function getOpeningBalance(
  id: OpeningBalanceId,
): Promise<OpeningBalanceResponse> {
  logger.info("Getting opening balance:", id);
  return invokeCommand("get_opening_balance", OpeningBalanceResponseSchema, {
    params: { id },
  });
}

/**
 * List opening balance entries with filtering and pagination
 */
export async function listOpeningBalances(
  filter?: OpeningBalanceQuery,
  pagination?: PaginationParams,
): Promise<PaginationResult<OpeningBalanceResponse>> {
  logger.info("Listing opening balances with filter:", filter);
  return invokeCommand(
    "list_opening_balances",
    PaginationResultSchema(OpeningBalanceResponseSchema),
    {
      params: {
        filter: filter || null,
        pagination: pagination || null,
      },
    },
  );
}

/**
 * Update opening balance entry
 */
export async function updateOpeningBalance(
  id: OpeningBalanceId,
  data: UpdateOpeningBalance,
): Promise<MutationResult> {
  logger.info("Updating opening balance:", id);
  return invokeCommand("update_opening_balance", MutationResultSchema, {
    params: { id, data },
  });
}

/**
 * Delete opening balance entry (soft delete via rejection)
 */
export async function deleteOpeningBalance(
  id: OpeningBalanceId,
  reason: string,
): Promise<MutationResult> {
  logger.info("Deleting opening balance:", id);
  return invokeCommand("delete_opening_balance", MutationResultSchema, {
    params: { id, data: reason },
  });
}

// ============================================================================
// Verification Workflow Operations
// ============================================================================

/**
 * Verify an opening balance entry
 */
export async function verifyOpeningBalance(
  id: OpeningBalanceId,
  verified_by: string,
): Promise<MutationResult> {
  logger.info("Verifying opening balance:", id);
  return invokeCommand("verify_opening_balance", MutationResultSchema, {
    params: { id, data: verified_by },
  });
}

/**
 * Reject an opening balance entry
 */
export async function rejectOpeningBalance(
  id: OpeningBalanceId,
  reason: string,
): Promise<MutationResult> {
  logger.info("Rejecting opening balance:", id);
  return invokeCommand("reject_opening_balance", MutationResultSchema, {
    params: { id, data: reason },
  });
}

// ============================================================================
// Adjustment Operations
// ============================================================================

/**
 * Create an adjustment to an opening balance entry
 */
export async function createOpeningBalanceAdjustment(
  data: CreateAdjustment,
  entered_by: string,
): Promise<MutationResult> {
  logger.info(
    "Creating adjustment for opening balance:",
    data.original_balance_id,
  );
  return invokeCommand(
    "create_opening_balance_adjustment",
    MutationResultSchema,
    {
      params: { data: [data, entered_by] },
    },
  );
}

// ============================================================================
// Query Operations
// ============================================================================

/**
 * Get all opening balance entries for a specific inventory item
 */
export async function getOpeningBalancesByItem(
  inventory_item_id: string,
): Promise<OpeningBalanceResponse[]> {
  logger.info("Getting opening balances for item:", inventory_item_id);
  return invokeCommand(
    "get_opening_balances_by_item",
    z.array(OpeningBalanceResponseSchema),
    {
      params: { id: inventory_item_id },
    },
  );
}

/**
 * Get all unverified opening balance entries
 */
export async function getUnverifiedOpeningBalances(): Promise<
  OpeningBalanceResponse[]
> {
  logger.info("Getting unverified opening balances");
  return invokeCommand(
    "get_unverified_opening_balances",
    z.array(OpeningBalanceResponseSchema),
    {},
  );
}

/**
 * Get opening balance entries by import batch ID
 */
export async function getOpeningBalancesByBatch(
  batch_id: string,
): Promise<OpeningBalanceResponse[]> {
  logger.info("Getting opening balances for batch:", batch_id);
  return invokeCommand(
    "get_opening_balances_by_batch",
    z.array(OpeningBalanceResponseSchema),
    {
      params: { id: batch_id },
    },
  );
}

// ============================================================================
// Statistics Operations
// ============================================================================

/**
 * Get opening balance statistics
 */
export async function getOpeningBalanceStatistics(): Promise<OpeningBalanceStatistics> {
  logger.info("Getting opening balance statistics");
  return invokeCommand(
    "get_opening_balance_statistics",
    OpeningBalanceStatisticsSchema,
    {},
  );
}

// ============================================================================
// Exports
// ============================================================================

export const openingBalanceApi = {
  // CRUD
  create: createOpeningBalance,
  get: getOpeningBalance,
  list: listOpeningBalances,
  update: updateOpeningBalance,
  delete: deleteOpeningBalance,

  // Verification Workflow
  verify: verifyOpeningBalance,
  reject: rejectOpeningBalance,

  // Adjustments
  createAdjustment: createOpeningBalanceAdjustment,

  // Queries
  getByItem: getOpeningBalancesByItem,
  getUnverified: getUnverifiedOpeningBalances,
  getByBatch: getOpeningBalancesByBatch,

  // Statistics
  getStatistics: getOpeningBalanceStatistics,
} as const;
