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
  defaultValue: any;
  options?: SettingOption[]; // للـ select و multiselect
  min?: number; // للـ number
  max?: number; // للـ number
  required?: boolean;
  validation?: (value: any) => boolean | string;
}

export interface Setting {
  id: string;
  key: string;
  value: any;
  updatedAt: Date;
}

export interface SettingsFormData {
  [key: string]: any;
}
