/**
 * Settings API
 *
 * Provides type-safe access to settings-related Tauri commands.
 * All functions handle both Tauri and browser environments gracefully.
 *
 * @module api/settings
 */

import { z } from "zod";
import { invokeCommand } from "@/lib/tauri-api";
import { createLogger } from "@/lib/logger";

const logger = createLogger("SettingsAPI");

// ============================================================================
// Schemas
// ============================================================================

/**
 * Setting ID schema
 */
export const SettingIdSchema = z.string().uuid();
export type SettingId = z.infer<typeof SettingIdSchema>;

/**
 * Setting response schema
 */
export const SettingResponseSchema = z.object({
  id: SettingIdSchema,
  key: z.string(),
  value: z.any(), // JSONB can be any valid JSON
  category: z.string().nullable(),
  description: z.string().nullable(),
  updated_by: SettingIdSchema.nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type SettingResponse = z.infer<typeof SettingResponseSchema>;

/**
 * Set setting DTO schema
 */
export const SetSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.any(), // JSONB can be any valid JSON
  category: z.string().max(50).optional(),
  description: z.string().optional(),
  updated_by: SettingIdSchema.optional(),
});
export type SetSetting = z.infer<typeof SetSettingSchema>;

/**
 * Set multiple settings DTO schema
 */
export const SetMultipleSettingsSchema = z.object({
  settings: z.array(SetSettingSchema),
});
export type SetMultipleSettings = z.infer<typeof SetMultipleSettingsSchema>;

/**
 * Setting query filters schema
 */
export const SettingQuerySchema = z.object({
  key: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
});
export type SettingQuery = z.infer<typeof SettingQuerySchema>;

/**
 * Mutation result schema
 */
export const MutationResultSchema = z.object({
  id: SettingIdSchema,
});
export type MutationResult = z.infer<typeof MutationResultSchema>;

/**
 * Settings statistics schema
 */
export const SettingsStatisticsSchema = z.object({
  total: z.number(),
  total_categories: z.number(),
});
export type SettingsStatistics = z.infer<typeof SettingsStatisticsSchema>;

/**
 * Typed value schemas
 */
export const StringValueSchema = z.object({
  value: z.string(),
});
export type StringValue = z.infer<typeof StringValueSchema>;

export const BoolValueSchema = z.object({
  value: z.boolean(),
});
export type BoolValue = z.infer<typeof BoolValueSchema>;

export const NumberValueSchema = z.object({
  value: z.number(),
});
export type NumberValue = z.infer<typeof NumberValueSchema>;

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Get setting by ID
 */
export async function getSettingById(id: SettingId): Promise<SettingResponse> {
  logger.info("Getting setting by ID:", id);
  return invokeCommand("get_setting_by_id", SettingResponseSchema, {
    params: { id },
  });
}

/**
 * Get setting by key
 */
export async function getSetting(key: string): Promise<SettingResponse> {
  logger.info("Getting setting:", key);
  return invokeCommand("get_setting", SettingResponseSchema, { key });
}

/**
 * Set a setting (create or update by key)
 */
export async function setSetting(data: SetSetting): Promise<MutationResult> {
  logger.info("Setting:", data.key);
  return invokeCommand("set_setting", MutationResultSchema, {
    params: { data },
  });
}

/**
 * Update setting by ID
 */
export async function updateSetting(
  id: SettingId,
  data: SetSetting,
): Promise<MutationResult> {
  logger.info("Updating setting:", id);
  return invokeCommand("update_setting", MutationResultSchema, {
    params: { id, data },
  });
}

/**
 * Delete setting by ID
 */
export async function deleteSettingById(
  id: SettingId,
): Promise<MutationResult> {
  logger.info("Deleting setting by ID:", id);
  return invokeCommand("delete_setting_by_id", MutationResultSchema, {
    params: { id },
  });
}

/**
 * Delete setting by key
 */
export async function deleteSetting(key: string): Promise<void> {
  logger.info("Deleting setting:", key);
  return invokeCommand("delete_setting", z.void(), { key });
}

/**
 * List settings with optional filtering
 */
export async function listSettings(
  filter?: SettingQuery,
): Promise<SettingResponse[]> {
  logger.info("Listing settings with filter:", filter);
  return invokeCommand("list_settings", z.array(SettingResponseSchema), {
    params: {
      filter: filter || null,
      pagination: null,
    },
  });
}

// ============================================================================
// Category Operations
// ============================================================================

/**
 * Get all settings in a category
 */
export async function getSettingsByCategory(
  category: string,
): Promise<SettingResponse[]> {
  logger.info("Getting settings by category:", category);
  return invokeCommand(
    "get_settings_by_category",
    z.array(SettingResponseSchema),
    { category },
  );
}

/**
 * Get all unique categories
 */
export async function getSettingCategories(): Promise<string[]> {
  logger.info("Getting setting categories");
  return invokeCommand("get_setting_categories", z.array(z.string()), {});
}

/**
 * Delete all settings in a category
 */
export async function deleteSettingCategory(category: string): Promise<number> {
  logger.info("Deleting category:", category);
  return invokeCommand("delete_setting_category", z.number(), { category });
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Set multiple settings at once
 */
export async function setMultipleSettings(
  data: SetMultipleSettings,
): Promise<void> {
  logger.info("Setting multiple settings:", data.settings.length);
  return invokeCommand("set_multiple_settings", z.void(), {
    params: { data },
  });
}

// ============================================================================
// Typed Getters
// ============================================================================

/**
 * Get setting value as string
 */
export async function getSettingString(key: string): Promise<string> {
  logger.info("Getting string setting:", key);
  const result = await invokeCommand("get_setting_string", StringValueSchema, {
    key,
  });
  return result.value;
}

/**
 * Get setting value as boolean
 */
export async function getSettingBool(key: string): Promise<boolean> {
  logger.info("Getting boolean setting:", key);
  const result = await invokeCommand("get_setting_bool", BoolValueSchema, {
    key,
  });
  return result.value;
}

/**
 * Get setting value as number
 */
export async function getSettingNumber(key: string): Promise<number> {
  logger.info("Getting number setting:", key);
  const result = await invokeCommand("get_setting_number", NumberValueSchema, {
    key,
  });
  return result.value;
}

// ============================================================================
// Existence Checks
// ============================================================================

/**
 * Check if a setting exists
 */
export async function settingExists(key: string): Promise<boolean> {
  logger.info("Checking if setting exists:", key);
  return invokeCommand("setting_exists", z.boolean(), { key });
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get settings statistics
 */
export async function getSettingsStatistics(): Promise<SettingsStatistics> {
  logger.info("Getting settings statistics");
  return invokeCommand("get_settings_statistics", SettingsStatisticsSchema, {});
}

// ============================================================================
// Exports
// ============================================================================

export const settingsApi = {
  // CRUD
  getById: getSettingById,
  get: getSetting,
  set: setSetting,
  update: updateSetting,
  deleteById: deleteSettingById,
  delete: deleteSetting,
  list: listSettings,

  // Category operations
  getByCategory: getSettingsByCategory,
  getCategories: getSettingCategories,
  deleteCategory: deleteSettingCategory,

  // Bulk operations
  setMultiple: setMultipleSettings,

  // Typed getters
  getString: getSettingString,
  getBool: getSettingBool,
  getNumber: getSettingNumber,

  // Existence checks
  exists: settingExists,

  // Statistics
  getStatistics: getSettingsStatistics,
} as const;
