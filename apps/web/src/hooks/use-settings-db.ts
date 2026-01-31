/**
 * TanStack DB Hooks for Settings
 *
 * Professional reactive hooks using TanStack DB with Tauri backend integration.
 * Provides optimistic updates, automatic cache synchronization, and real-time reactivity.
 *
 * @module hooks/use-settings-db
 */

import {
  createCollection,
  eq,
  useLiveQuery,
  or,
  ilike,
} from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { toast } from "sonner";
import { useMemo } from "react";
import { queryClient } from "@/lib/query-client";
import { createLogger } from "@/lib/logger";
import {
  settingsApi,
  SettingResponseSchema,
  type SettingResponse,
  type SetSetting,
  type SettingId,
  type SettingsStatistics,
  type MultilingualDescription,
} from "@/api/settings.api";

const logger = createLogger("SettingsDB");

// ============================================================================
// Query Keys
// ============================================================================

export const settingKeys = {
  all: ["settings"] as const,
  statistics: ["settings", "statistics"] as const,
  categories: ["settings", "categories"] as const,
} as const;

// ============================================================================
// Collection Definition
// ============================================================================

/**
 * Settings collection with Tauri backend integration
 * Provides reactive queries with automatic cache management
 */
export const settingsCollection = createCollection(
  queryCollectionOptions({
    queryClient,
    queryKey: settingKeys.all,

    // Fetch from Tauri backend
    queryFn: async (): Promise<SettingResponse[]> => {
      try {
        logger.info("Fetching settings from Tauri backend");
        const settings = await settingsApi.list();

        // Validate all settings
        const validatedSettings = settings.map((setting) =>
          SettingResponseSchema.parse(setting),
        );

        logger.info(`Fetched ${validatedSettings.length} settings`);
        return validatedSettings;
      } catch (error) {
        logger.error("Failed to fetch settings:", error);
        toast.error("Failed to load settings");
        throw error;
      }
    },

    getKey: (setting: SettingResponse) => setting.id,

    // Handle INSERT operations
    onInsert: async ({ transaction }) => {
      const mutation = transaction.mutations[0];
      const newSetting = mutation.modified as SettingResponse & {
        _setData?: SetSetting;
      };

      try {
        logger.info("Creating setting:", newSetting.key);

        // If we have set data, use it; otherwise extract from setting
        const setData: SetSetting = newSetting._setData || {
          key: newSetting.key,
          value: newSetting.value,
          category: newSetting.category || undefined,
          description: newSetting.description || undefined,
          updated_by: newSetting.updated_by || undefined,
        };

        // Call Tauri backend
        const result = await settingsApi.set(setData);

        logger.info("Setting created successfully:", result.id);
        // Don't show toast for settings creation - they happen automatically

        // Invalidate statistics and categories
        queryClient.invalidateQueries({ queryKey: settingKeys.statistics });
        queryClient.invalidateQueries({ queryKey: settingKeys.categories });
      } catch (error) {
        logger.error("Failed to create setting:", error);
        toast.error(
          `Failed to create setting: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        throw error;
      }
    },

    // Handle UPDATE operations
    onUpdate: async ({ transaction }) => {
      const mutation = transaction.mutations[0];
      const modified = mutation.modified as SettingResponse;
      const original = mutation.original as SettingResponse;

      try {
        logger.info("Updating setting:", modified.id);

        // Build update data
        const updates: SetSetting = {
          key: modified.key,
          value: modified.value,
          category: modified.category || undefined,
          description: modified.description || undefined,
          updated_by: modified.updated_by || undefined,
        };

        // Call Tauri backend
        await settingsApi.update(modified.id, updates);

        logger.info("Setting updated successfully:", modified.id);
        // Don't show toast for settings updates - they happen frequently and would be annoying

        // Invalidate statistics if category changed
        if (modified.category !== original.category) {
          queryClient.invalidateQueries({ queryKey: settingKeys.statistics });
          queryClient.invalidateQueries({ queryKey: settingKeys.categories });
        }
      } catch (error) {
        logger.error("Failed to update setting:", error);
        toast.error(
          `Failed to update setting: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        throw error;
      }
    },

    // Handle DELETE operations
    onDelete: async ({ transaction }) => {
      const mutation = transaction.mutations[0];
      const original = mutation.original as SettingResponse;

      try {
        logger.info("Deleting setting:", original.id);

        // Call Tauri backend
        await settingsApi.deleteById(original.id);

        logger.info("Setting deleted successfully:", original.id);
        toast.success(`Setting "${original.key}" deleted successfully`);

        // Invalidate statistics and categories
        queryClient.invalidateQueries({ queryKey: settingKeys.statistics });
        queryClient.invalidateQueries({ queryKey: settingKeys.categories });
      } catch (error) {
        logger.error("Failed to delete setting:", error);
        toast.error(
          `Failed to delete setting: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        throw error;
      }
    },
  }),
);

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get all settings with reactive updates
 *
 * @example
 * ```tsx
 * const { data: settings, isLoading } = useSettings();
 * ```
 */
export function useSettings() {
  const query = useLiveQuery((q) => q.from({ setting: settingsCollection }));

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/**
 * Get a single setting by ID
 *
 * @param id - Setting ID
 * @example
 * ```tsx
 * const { data: setting } = useSetting(settingId);
 * ```
 */
export function useSetting(id: SettingId) {
  const query = useLiveQuery(
    (q) =>
      q
        .from({ setting: settingsCollection })
        .where(({ setting }) => eq(setting.id, id))
        .orderBy(({ setting }) => setting.created_at)
        .limit(1),
    [id],
  );

  return {
    data: query.data?.[0] || null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/**
 * Get a setting by key
 *
 * @param key - Setting key
 * @example
 * ```tsx
 * const { data: setting } = useSettingByKey('app.theme');
 * ```
 */
export function useSettingByKey(key: string) {
  const query = useLiveQuery(
    (q) =>
      q
        .from({ setting: settingsCollection })
        .where(({ setting }) => eq(setting.key, key))
        .orderBy(({ setting }) => setting.created_at)
        .limit(1),
    [key],
  );

  return {
    data: query.data?.[0] || null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/**
 * Get settings by category
 *
 * @param category - Category to filter by
 * @example
 * ```tsx
 * const { data: appSettings } = useSettingsByCategory('app');
 * ```
 */
export function useSettingsByCategory(category: string | null) {
  const query = useLiveQuery(
    (q) => {
      if (!category) {
        return q.from({ setting: settingsCollection });
      }
      return q
        .from({ setting: settingsCollection })
        .where(({ setting }) => eq(setting.category, category));
    },
    [category],
  );

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/**
 * Search settings by key or description
 *
 * @param searchQuery - Search term
 * @example
 * ```tsx
 * const { data: results } = useSearchSettings('theme');
 * ```
 */
export function useSearchSettings(searchQuery: string) {
  // Use live query with SQL-like pattern matching
  const query = useLiveQuery(
    (q) => {
      // If search query is empty or too short, return all settings
      if (!searchQuery || searchQuery.length < 2) {
        return q.from({ setting: settingsCollection });
      }

      // Use SQL ILIKE for case-insensitive pattern matching
      const pattern = `%${searchQuery}%`;

      return q
        .from({ setting: settingsCollection })
        .where(({ setting }) =>
          or(ilike(setting.key, pattern), ilike(setting.category, pattern)),
        );
    },
    [searchQuery], // Re-run when search query changes
  );

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/**
 * Get unique categories (computed from collection)
 *
 * @example
 * ```tsx
 * const { data: categories } = useSettingCategories();
 * ```
 */
export function useSettingCategories() {
  const { data: settings, isLoading, isError } = useSettings();

  const categories = useMemo(() => {
    if (!settings) return [];

    const uniqueCategories = new Set<string>();
    settings.forEach((setting) => {
      if (setting.category) {
        uniqueCategories.add(setting.category);
      }
    });

    return Array.from(uniqueCategories).sort();
  }, [settings]);

  return {
    data: categories,
    isLoading,
    isError,
  };
}

/**
 * Get settings statistics (computed from collection)
 *
 * @example
 * ```tsx
 * const stats = useSettingsStatistics();
 * // stats: { total, total_categories }
 * ```
 */
export function useSettingsStatistics() {
  const { data: settings } = useSettings();
  const { data: categories } = useSettingCategories();

  const stats = useMemo<SettingsStatistics>(() => {
    return {
      total: settings?.length || 0,
      total_categories: categories?.length || 0,
    };
  }, [settings, categories]);

  return stats;
}

/**
 * Get a setting value with type safety
 *
 * @param key - Setting key
 * @param defaultValue - Default value if setting doesn't exist
 * @example
 * ```tsx
 * const theme = useSettingValue<string>('defaultTheme', 'light');
 * ```
 */
export function useSettingValue<T = any>(
  key: string,
  defaultValue?: T,
): T | undefined {
  const { data: setting, isLoading } = useSettingByKey(key);

  return useMemo(() => {
    if (isLoading) return defaultValue;
    if (!setting) return defaultValue;
    return setting.value as T;
  }, [setting?.value, setting?.id, defaultValue, isLoading]);
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Set a setting (create or update)
 *
 * @internal Used internally by useUpsertSettingValue
 * @example
 * ```tsx
 * const setSetting = useSetSetting();
 *
 * setSetting.mutate({
 *   key: 'app.theme',
 *   value: 'dark',
 *   category: 'app',
 * });
 * ```
 */
export function useSetSetting() {
  return {
    mutate: (
      data: SetSetting,
      options?: {
        onSuccess?: (setting: SettingResponse) => void;
        onError?: (error: Error) => void;
      },
    ) => {
      try {
        // Create optimistic setting object
        const optimisticSetting: SettingResponse & { _setData: SetSetting } = {
          id: crypto.randomUUID(), // Temporary ID
          key: data.key,
          value: data.value,
          category: data.category || null,
          description: data.description || null,
          updated_by: data.updated_by || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          _setData: data, // Store set data for backend call
        };

        // Validate
        const validatedSetting = SettingResponseSchema.parse(optimisticSetting);

        // Insert into collection (triggers onInsert)
        settingsCollection.insert(validatedSetting);

        options?.onSuccess?.(validatedSetting);
        return validatedSetting;
      } catch (error) {
        logger.error("Error setting:", error);
        options?.onError?.(error as Error);
        throw error;
      }
    },
  };
}

/**
 * Update an existing setting
 *
 * @deprecated Use useUpsertSettingValue instead for automatic create-or-update
 * @internal Kept for backward compatibility
 * @example
 * ```tsx
 * const updateSetting = useUpdateSetting();
 *
 * updateSetting.mutate({
 *   id: settingId,
 *   data: { value: 'new-value' },
 * });
 * ```
 */
export function useUpdateSetting() {
  return {
    mutate: (
      { id, data }: { id: SettingId; data: Partial<SetSetting> },
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      try {
        // Update in collection (triggers onUpdate)
        settingsCollection.update(id, (draft) => {
          if (data.key !== undefined) draft.key = data.key;
          if (data.value !== undefined) draft.value = data.value;
          if (data.category !== undefined)
            draft.category = data.category || null;
          if (data.description !== undefined)
            draft.description = data.description || null;
          if (data.updated_by !== undefined)
            draft.updated_by = data.updated_by || null;
          draft.updated_at = new Date().toISOString();
        });

        options?.onSuccess?.();
      } catch (error) {
        logger.error("Error updating setting:", error);
        options?.onError?.(error as Error);
        throw error;
      }
    },
  };
}

/**
 * Set or update a setting value by key (upsert operation)
 * Creates the setting if it doesn't exist, updates if it does
 *
 * @example
 * ```tsx
 * const upsertValue = useUpsertSettingValue();
 *
 * upsertValue.mutate({ key: 'app.theme', value: 'dark' });
 * ```
 */
export function useUpsertSettingValue() {
  const { data: settings } = useSettings();
  const setSetting = useSetSetting();

  return {
    mutate: (
      {
        key,
        value,
        category,
        description,
      }: {
        key: string;
        value: any;
        category?: string;
        description?: MultilingualDescription;
      },
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      try {
        // Find setting by key from query results
        const setting = settings?.find((s: SettingResponse) => s.key === key);

        if (setting) {
          // Update existing setting
          settingsCollection.update(setting.id, (draft) => {
            draft.value = value;
            draft.updated_at = new Date().toISOString();
          });
          // Call onSuccess after update is applied
          options?.onSuccess?.();
        } else {
          // Create new setting
          setSetting.mutate(
            {
              key,
              value,
              category,
              description,
            },
            {
              onSuccess: options?.onSuccess,
              onError: options?.onError,
            },
          );
        }
      } catch (error) {
        logger.error("Error upserting setting value:", error);
        options?.onError?.(error as Error);
        throw error;
      }
    },
  };
}

/**
 * Delete a setting
 *
 * @deprecated Settings should not be deleted in production
 * @internal Kept for development/testing purposes
 * @example
 * ```tsx
 * const deleteSetting = useDeleteSetting();
 *
 * deleteSetting.mutate(settingId);
 * ```
 */
export function useDeleteSetting() {
  return {
    mutate: (
      id: SettingId,
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      try {
        // Delete from collection (triggers onDelete)
        settingsCollection.delete(id);
        options?.onSuccess?.();
      } catch (error) {
        logger.error("Error deleting setting:", error);
        options?.onError?.(error as Error);
        throw error;
      }
    },
  };
}

/**
 * Delete a setting by key
 *
 * @example
 * ```tsx
 * const deleteByKey = useDeleteSettingByKey();
 *
 * deleteByKey.mutate('app.theme');
 * ```
 */
export function useDeleteSettingByKey() {
  const { data: settings } = useSettings();

  return {
    mutate: (
      key: string,
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      try {
        // Find setting by key from query results
        const setting = settings?.find((s: SettingResponse) => s.key === key);

        if (!setting) {
          throw new Error(`Setting with key "${key}" not found`);
        }

        // Delete from collection
        settingsCollection.delete(setting.id);
        options?.onSuccess?.();
      } catch (error) {
        logger.error("Error deleting setting by key:", error);
        options?.onError?.(error as Error);
        throw error;
      }
    },
  };
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Refresh settings from backend
 *
 * @example
 * ```tsx
 * const refreshSettings = useRefreshSettings();
 *
 * <button onClick={refreshSettings}>Refresh</button>
 * ```
 */
export function useRefreshSettings() {
  return () => {
    logger.info("Manually refreshing settings");
    queryClient.invalidateQueries({ queryKey: settingKeys.all });
    toast.info("Refreshing settings...");
  };
}
