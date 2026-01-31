// أنواع بيانات الإعدادات
export type SettingType =
  | "text"
  | "number"
  | "boolean"
  | "select"
  | "multiselect"
  | "color";

export type SettingCategory =
  | "general" // عام
  | "orders" // الطلبات
  | "suppliers" // الموردين
  | "notifications" // الإشعارات
  | "appearance" // المظهر
  | "alerts" // التنبيهات
  | "system"; // النظام

export interface SettingOption {
  value: string;
  label: string;
}

export interface SettingDefinition {
  id: string;
  category: SettingCategory;
  key: string;
  label: string;
  description: string;
  type: SettingType;
  defaultValue: unknown;
  options?: SettingOption[]; // للـ select و multiselect
  min?: number; // للـ number
  max?: number; // للـ number
  required?: boolean;
  validation?: (value: unknown) => boolean | string;
}
