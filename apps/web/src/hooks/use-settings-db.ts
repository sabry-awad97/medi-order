/**
 * TanStack DB Hooks for Settings
 *
 * Drop-in replacement for use-settings.ts using TanStack DB.
 * Same API, but with reactive collections and optimistic updates.
 */

import { createCollection, eq, useLiveQuery } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { toast } from "sonner";
import { z } from "zod";
import { useMemo } from "react";
import { queryClient } from "@/lib/query-client";
import {
  SETTINGS_DEFINITIONS,
  getAllDefaultValues,
} from "@/lib/settings-definitions";
import {
  SettingsSchema,
  PartialSettingsSchema,
  type Settings,
  type PartialSettings,
} from "@/lib/types-settings";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

interface SettingItem {
  key: string;
  value: unknown;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function fetchSettings(): Promise<SettingItem[]> {
  try {
    const { default: localforage } = await import("localforage");

    const settingsDB = localforage.createInstance({
      name: "pharmacy-special-orders",
      storeName: "settings",
    });

    const settings: SettingItem[] = [];
    await settingsDB.iterate<unknown, void>((value, key) => {
      settings.push({ key, value });
    });

    return settings;
  } catch (error) {
    logger.error("Error fetching settings:", error);
    return [];
  }
}

async function saveSettingAPI(key: string, value: unknown): Promise<void> {
  const { default: localforage } = await import("localforage");
  const settingsDB = localforage.createInstance({
    name: "pharmacy-special-orders",
    storeName: "settings",
  });
  await settingsDB.setItem(key, value);
}

async function deleteSettingAPI(key: string): Promise<void> {
  const { default: localforage } = await import("localforage");
  const settingsDB = localforage.createInstance({
    name: "pharmacy-special-orders",
    storeName: "settings",
  });
  await settingsDB.removeItem(key);
}

async function clearSettingsAPI(): Promise<void> {
  const { default: localforage } = await import("localforage");
  const settingsDB = localforage.createInstance({
    name: "pharmacy-special-orders",
    storeName: "settings",
  });
  await settingsDB.clear();
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const settingsKeys = {
  all: ["settings"] as const,
};

// ============================================================================
// COLLECTION DEFINITION
// ============================================================================

export const settingsCollection = createCollection(
  queryCollectionOptions({
    queryKey: settingsKeys.all,
    queryClient,
    queryFn: fetchSettings,
    getKey: (setting) => setting.key,

    onInsert: async ({ transaction }) => {
      const { modified } = transaction.mutations[0];
      await saveSettingAPI(modified.key, modified.value);
    },

    onUpdate: async ({ transaction }) => {
      const { modified } = transaction.mutations[0];
      await saveSettingAPI(modified.key, modified.value);
    },

    onDelete: async ({ transaction }) => {
      const { original } = transaction.mutations[0];
      await deleteSettingAPI(original.key);
    },
  }),
);

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook لجلب جميع الإعدادات
 */
export function useSettings() {
  const query = useLiveQuery((q) => q.from({ setting: settingsCollection }));

  // دمج القيم المحفوظة مع القيم الافتراضية
  const settings: Settings = useMemo(() => {
    const defaults = getAllDefaultValues();
    const merged: Record<string, unknown> = { ...defaults };

    if (query.data) {
      query.data.forEach((setting) => {
        merged[setting.key] = setting.value;
      });
    }

    // التحقق من صحة البيانات باستخدام Zod
    try {
      return SettingsSchema.parse(merged);
    } catch (error) {
      logger.error("Settings validation error:", error);
      // إرجاع القيم الافتراضية في حالة فشل التحقق
      return SettingsSchema.parse(defaults);
    }
  }, [query.data]);

  return {
    data: settings,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/**
 * Hook لجلب إعداد واحد
 */
export function useSetting(key: string) {
  const query = useLiveQuery(
    (q) =>
      q
        .from({ setting: settingsCollection })
        .where(({ setting }) => eq(setting.key, key))
        .findOne(),
    [key],
  );

  const value = useMemo(() => {
    if (query.data) return query.data.value;

    // إرجاع القيمة الافتراضية إذا لم يكن محفوظاً
    const definition = SETTINGS_DEFINITIONS.find((s) => s.key === key);
    return definition?.defaultValue ?? null;
  }, [query.data, key]);

  return {
    data: value,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/**
 * Hook لتحديث إعداد واحد
 */
export function useUpdateSetting() {
  return {
    mutate: (
      { key, value }: { key: string; value: unknown },
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      try {
        // التحقق من صحة القيمة حسب نوع الإعداد
        const definition = SETTINGS_DEFINITIONS.find((s) => s.key === key);
        if (definition?.validation) {
          const validationResult = definition.validation(value);
          if (validationResult !== true) {
            throw new Error(
              typeof validationResult === "string"
                ? validationResult
                : "قيمة غير صالحة",
            );
          }
        }

        // Try to update, if it fails, insert
        try {
          settingsCollection.update(key, (draft) => {
            draft.value = value;
          });
        } catch {
          // Setting doesn't exist, insert it
          settingsCollection.insert({ key, value });
        }

        toast.success("تم حفظ الإعداد بنجاح");
        options?.onSuccess?.();
      } catch (error) {
        logger.error("Error updating setting:", error);
        toast.error(
          error instanceof Error ? error.message : "فشل في حفظ الإعداد",
        );
        options?.onError?.(error as Error);
      }
    },
  };
}

/**
 * Hook لتحديث عدة إعدادات دفعة واحدة
 */
export function useUpdateSettings() {
  return {
    mutate: (
      settings: PartialSettings,
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      try {
        // التحقق من صحة البيانات باستخدام Zod
        const validated = PartialSettingsSchema.parse(settings);

        // Update or insert each setting
        Object.entries(validated).forEach(([key, value]) => {
          try {
            settingsCollection.update(key, (draft) => {
              draft.value = value;
            });
          } catch {
            // Setting doesn't exist, insert it
            settingsCollection.insert({ key, value });
          }
        });

        toast.success("تم حفظ الإعدادات بنجاح");
        options?.onSuccess?.();
      } catch (error) {
        logger.error("Error updating settings:", error);
        if (error instanceof z.ZodError) {
          const firstError = error.issues[0];
          toast.error(`خطأ في التحقق: ${firstError.message}`);
        } else {
          toast.error("فشل في حفظ الإعدادات");
        }
        options?.onError?.(error as Error);
      }
    },
  };
}

/**
 * Hook لإعادة تعيين الإعدادات إلى القيم الافتراضية
 */
export function useResetSettings() {
  return {
    mutate: async (
      _?: void,
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      try {
        // Clear all settings from IndexedDB
        await clearSettingsAPI();

        // Insert default values
        const defaults = getAllDefaultValues();
        const validated = SettingsSchema.parse(defaults);

        Object.entries(validated).forEach(([key, value]) => {
          try {
            settingsCollection.update(key, (draft) => {
              draft.value = value;
            });
          } catch {
            settingsCollection.insert({ key, value });
          }
        });

        toast.success("تم إعادة تعيين الإعدادات إلى القيم الافتراضية");
        options?.onSuccess?.();
      } catch (error) {
        logger.error("Error resetting settings:", error);
        toast.error("فشل في إعادة تعيين الإعدادات");
        options?.onError?.(error as Error);
      }
    },
  };
}

/**
 * Hook لتصدير الإعدادات
 */
export function useExportSettings() {
  return {
    mutate: async (
      _?: void,
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      try {
        const settings = await fetchSettings();
        const data = JSON.stringify(settings, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `pharmacy-settings-${new Date().toISOString().split("T")[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);

        toast.success("تم تصدير الإعدادات بنجاح");
        options?.onSuccess?.();
      } catch (error) {
        logger.error("Error exporting settings:", error);
        toast.error("فشل في تصدير الإعدادات");
        options?.onError?.(error as Error);
      }
    },
  };
}

/**
 * Hook لاستيراد الإعدادات
 */
export function useImportSettings() {
  return {
    mutate: async (
      file: File,
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      try {
        const text = await file.text();
        const data = JSON.parse(text);

        // التحقق من صحة البيانات
        if (!Array.isArray(data)) {
          throw new Error("صيغة الملف غير صالحة");
        }

        // تحويل المصفوفة إلى كائن
        const settingsObj: Record<string, unknown> = {};
        for (const setting of data) {
          if (setting.key && setting.value !== undefined) {
            settingsObj[setting.key] = setting.value;
          }
        }

        // التحقق من صحة البيانات باستخدام Zod
        const validated = PartialSettingsSchema.parse(settingsObj);

        // Update or insert each setting
        Object.entries(validated).forEach(([key, value]) => {
          try {
            settingsCollection.update(key, (draft) => {
              draft.value = value;
            });
          } catch {
            settingsCollection.insert({ key, value });
          }
        });

        toast.success("تم استيراد الإعدادات بنجاح");
        options?.onSuccess?.();
      } catch (error) {
        logger.error("Error importing settings:", error);
        if (error instanceof z.ZodError) {
          const firstError = error.issues[0];
          toast.error(`خطأ في التحقق: ${firstError.message}`);
        } else if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("فشل في استيراد الإعدادات");
        }
        options?.onError?.(error as Error);
      }
    },
  };
}
