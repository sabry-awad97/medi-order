import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import db from "@/lib/db";
import {
  SETTINGS_DEFINITIONS,
  getAllDefaultValues,
} from "@/lib/settings-definitions";
import type { SettingsFormData } from "@/lib/types-settings";

// Hook لجلب جميع الإعدادات
export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const settings = await db.settings.getAll();
      const defaults = getAllDefaultValues();

      // دمج القيم المحفوظة مع القيم الافتراضية
      const merged: Record<string, any> = { ...defaults };
      settings.forEach((setting) => {
        merged[setting.key] = setting.value;
      });

      return merged;
    },
  });
}

// Hook لجلب إعداد واحد
export function useSetting(key: string) {
  return useQuery({
    queryKey: ["settings", key],
    queryFn: async () => {
      const value = await db.settings.get(key);
      if (value !== null) return value;

      // إرجاع القيمة الافتراضية إذا لم يكن محفوظاً
      const definition = SETTINGS_DEFINITIONS.find((s) => s.key === key);
      return definition?.defaultValue ?? null;
    },
    enabled: !!key,
  });
}

// Hook لتحديث إعداد واحد
export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      return await db.settings.set(key, value);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["settings", variables.key] });
      toast.success("تم حفظ الإعداد بنجاح");
    },
    onError: (error) => {
      console.error("Error updating setting:", error);
      toast.error("فشل في حفظ الإعداد");
    },
  });
}

// Hook لتحديث عدة إعدادات دفعة واحدة
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: SettingsFormData) => {
      await db.settings.setMany(settings);
      return settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("تم حفظ الإعدادات بنجاح");
    },
    onError: (error) => {
      console.error("Error updating settings:", error);
      toast.error("فشل في حفظ الإعدادات");
    },
  });
}

// Hook لإعادة تعيين الإعدادات إلى القيم الافتراضية
export function useResetSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await db.settings.clear();
      const defaults = getAllDefaultValues();
      await db.settings.setMany(defaults);
      return defaults;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("تم إعادة تعيين الإعدادات إلى القيم الافتراضية");
    },
    onError: (error) => {
      console.error("Error resetting settings:", error);
      toast.error("فشل في إعادة تعيين الإعدادات");
    },
  });
}

// Hook لتصدير الإعدادات
export function useExportSettings() {
  return useMutation({
    mutationFn: async () => {
      const settings = await db.settings.getAll();
      const data = JSON.stringify(settings, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pharmacy-settings-${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      return settings;
    },
    onSuccess: () => {
      toast.success("تم تصدير الإعدادات بنجاح");
    },
    onError: (error) => {
      console.error("Error exporting settings:", error);
      toast.error("فشل في تصدير الإعدادات");
    },
  });
}

// Hook لاستيراد الإعدادات
export function useImportSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      const settings = JSON.parse(text);

      // التحقق من صحة البيانات
      if (!Array.isArray(settings)) {
        throw new Error("Invalid settings format");
      }

      // حفظ الإعدادات
      for (const setting of settings) {
        await db.settings.set(setting.key, setting.value);
      }

      return settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("تم استيراد الإعدادات بنجاح");
    },
    onError: (error) => {
      console.error("Error importing settings:", error);
      toast.error("فشل في استيراد الإعدادات");
    },
  });
}
