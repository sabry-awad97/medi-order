import { z } from "zod";
import type { OrderStatus } from "./types";

// ========================================
// SETTINGS TYPES
// ========================================

// Setting data types
export type SettingType =
  | "text"
  | "number"
  | "boolean"
  | "select"
  | "multiselect"
  | "color";

export type SettingCategory =
  | "general" // General
  | "orders" // Orders
  | "suppliers" // Suppliers
  | "notifications" // Notifications
  | "appearance" // Appearance
  | "alerts" // Alerts
  | "system"; // System

export interface SettingOption {
  value: string;
  label: string;
}

export interface SettingDefinition {
  id: string;
  category: SettingCategory;
  key: SettingKey;
  label: string;
  description: {
    en: string;
    ar: string;
  };
  type: SettingType;
  defaultValue: unknown;
  options?: SettingOption[]; // For select and multiselect
  min?: number; // For number
  max?: number; // For number
  required?: boolean;
  validation?: (value: unknown) => boolean | string;
}

// ========================================
// ORDER STATUS CONFIGURATION
// ========================================

// Order statuses with colors and Arabic labels
export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    color: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  pending: {
    label: "قيد الانتظار",
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    variant: "secondary",
  },
  ordered: {
    label: "تم الطلب",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    variant: "default",
  },
  arrived: {
    label: "وصل",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    variant: "outline",
  },
  delivered: {
    label: "تم التسليم",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    variant: "outline",
  },
  cancelled: {
    label: "ملغي",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    variant: "destructive",
  },
};

// ========================================
// MEDICINE FORMS
// ========================================

// Pharmaceutical medicine forms (in Arabic)
export const MEDICINE_FORMS = [
  "أقراص",
  "كبسولات",
  "شراب",
  "أمبول",
  "حقن",
  "مرهم",
  "كريم",
  "قطرة",
  "بخاخ",
  "لبوس",
  "أخرى",
] as const;

// Schema for medicine form
export const MedicineFormSchema = z.enum(MEDICINE_FORMS);

export type MedicineForm = z.infer<typeof MedicineFormSchema>;

// ========================================
// SETTINGS KEYS
// ========================================

/**
 * Settings Keys Constants
 *
 * Centralized constants for all setting keys to avoid typos and enable type-safe refactoring.
 * These keys must match the `key` field in SETTINGS_DEFINITIONS.
 */

// ========== General Settings ==========
export const SETTING_PHARMACY_NAME = "pharmacyName" as const;
export const SETTING_PHARMACY_PHONE = "pharmacyPhone" as const;
export const SETTING_PHARMACY_ADDRESS = "pharmacyAddress" as const;
export const SETTING_WORKING_HOURS = "workingHours" as const;

// ========== Orders Settings ==========
export const SETTING_DEFAULT_ORDER_STATUS = "defaultOrderStatus" as const;
export const SETTING_AUTO_ARCHIVE_DAYS = "autoArchiveDays" as const;
export const SETTING_REQUIRE_CUSTOMER_PHONE = "requireCustomerPhone" as const;
export const SETTING_ALLOWED_MEDICINE_FORMS = "allowedMedicineForms" as const;
export const SETTING_MAX_MEDICINES_PER_ORDER = "maxMedicinesPerOrder" as const;

// ========== Suppliers Settings ==========
export const SETTING_MIN_SUPPLIER_RATING = "minSupplierRating" as const;
export const SETTING_MAX_DELIVERY_DAYS = "maxDeliveryDays" as const;
export const SETTING_REQUIRE_SUPPLIER_EMAIL = "requireSupplierEmail" as const;

// ========== Alerts Settings ==========
export const SETTING_ENABLE_ALERTS = "enableAlerts" as const;
export const SETTING_OLD_ORDER_THRESHOLD = "oldOrderThreshold" as const;
export const SETTING_PICKUP_REMINDER_DAYS = "pickupReminderDays" as const;
export const SETTING_ALERT_CHECK_INTERVAL = "alertCheckInterval" as const;

// ========== Notifications Settings ==========
export const SETTING_ENABLE_NOTIFICATIONS = "enableNotifications" as const;
export const SETTING_NOTIFICATION_SOUND = "notificationSound" as const;
export const SETTING_NOTIFY_ON_NEW_ORDER = "notifyOnNewOrder" as const;
export const SETTING_NOTIFY_ON_STATUS_CHANGE = "notifyOnStatusChange" as const;

// ========== Appearance Settings ==========
export const SETTING_DEFAULT_THEME = "defaultTheme" as const;
export const SETTING_DEFAULT_LANGUAGE = "defaultLanguage" as const;
export const SETTING_SIDEBAR_DEFAULT_STATE = "sidebarDefaultState" as const;
export const SETTING_ITEMS_PER_PAGE = "itemsPerPage" as const;
export const SETTING_INVENTORY_VIEW_MODE = "inventoryViewMode" as const;

// ========== System Settings ==========
export const SETTING_ENABLE_DEV_MODE = "enableDevMode" as const;
export const SETTING_AUTO_BACKUP = "autoBackup" as const;
export const SETTING_BACKUP_INTERVAL_DAYS = "backupIntervalDays" as const;

// Type for all setting keys
export type SettingKey =
  | typeof SETTING_PHARMACY_NAME
  | typeof SETTING_PHARMACY_PHONE
  | typeof SETTING_PHARMACY_ADDRESS
  | typeof SETTING_WORKING_HOURS
  | typeof SETTING_DEFAULT_ORDER_STATUS
  | typeof SETTING_AUTO_ARCHIVE_DAYS
  | typeof SETTING_REQUIRE_CUSTOMER_PHONE
  | typeof SETTING_ALLOWED_MEDICINE_FORMS
  | typeof SETTING_MAX_MEDICINES_PER_ORDER
  | typeof SETTING_MIN_SUPPLIER_RATING
  | typeof SETTING_MAX_DELIVERY_DAYS
  | typeof SETTING_REQUIRE_SUPPLIER_EMAIL
  | typeof SETTING_ENABLE_ALERTS
  | typeof SETTING_OLD_ORDER_THRESHOLD
  | typeof SETTING_PICKUP_REMINDER_DAYS
  | typeof SETTING_ALERT_CHECK_INTERVAL
  | typeof SETTING_ENABLE_NOTIFICATIONS
  | typeof SETTING_NOTIFICATION_SOUND
  | typeof SETTING_NOTIFY_ON_NEW_ORDER
  | typeof SETTING_NOTIFY_ON_STATUS_CHANGE
  | typeof SETTING_DEFAULT_THEME
  | typeof SETTING_DEFAULT_LANGUAGE
  | typeof SETTING_SIDEBAR_DEFAULT_STATE
  | typeof SETTING_ITEMS_PER_PAGE
  | typeof SETTING_INVENTORY_VIEW_MODE
  | typeof SETTING_ENABLE_DEV_MODE
  | typeof SETTING_AUTO_BACKUP
  | typeof SETTING_BACKUP_INTERVAL_DAYS;

// ========================================
// SETTINGS DEFINITIONS
// ========================================

export const SETTINGS_DEFINITIONS: SettingDefinition[] = [
  // ========== General Settings ==========
  {
    id: "pharmacy-name",
    category: "general",
    key: SETTING_PHARMACY_NAME,
    label: "fields.pharmacyName.label",
    description: {
      en: "The name of your pharmacy or medical facility",
      ar: "اسم الصيدلية أو المنشأة الطبية الخاصة بك",
    },
    type: "text",
    defaultValue: "Pharmacy",
    required: true,
  },
  {
    id: "pharmacy-phone",
    category: "general",
    key: SETTING_PHARMACY_PHONE,
    label: "fields.pharmacyPhone.label",
    description: {
      en: "Contact phone number for your pharmacy",
      ar: "رقم الهاتف للتواصل مع الصيدلية",
    },
    type: "text",
    defaultValue: "",
  },
  {
    id: "pharmacy-address",
    category: "general",
    key: SETTING_PHARMACY_ADDRESS,
    label: "fields.pharmacyAddress.label",
    description: {
      en: "Physical address of your pharmacy",
      ar: "العنوان الفعلي للصيدلية",
    },
    type: "text",
    defaultValue: "",
  },
  {
    id: "working-hours",
    category: "general",
    key: SETTING_WORKING_HOURS,
    label: "fields.workingHours.label",
    description: {
      en: "Operating hours of your pharmacy",
      ar: "ساعات عمل الصيدلية",
    },
    type: "text",
    defaultValue: "9 AM - 10 PM",
  },

  // ========== Orders Settings ==========
  {
    id: "default-order-status",
    category: "orders",
    key: SETTING_DEFAULT_ORDER_STATUS,
    label: "fields.defaultOrderStatus.label",
    description: {
      en: "Default status for new orders",
      ar: "الحالة الافتراضية للطلبات الجديدة",
    },
    type: "select",
    defaultValue: "pending",
    options: [
      {
        value: "pending",
        label: "fields.defaultOrderStatus.options.pending",
      },
      {
        value: "ordered",
        label: "fields.defaultOrderStatus.options.ordered",
      },
    ],
    required: true,
  },
  {
    id: "auto-archive-days",
    category: "orders",
    key: SETTING_AUTO_ARCHIVE_DAYS,
    label: "fields.autoArchiveDays.label",
    description: {
      en: "Number of days before delivered orders are automatically archived",
      ar: "عدد الأيام قبل أرشفة الطلبات المسلمة تلقائياً",
    },
    type: "number",
    defaultValue: 30,
    min: 0,
    max: 365,
  },
  {
    id: "require-customer-phone",
    category: "orders",
    key: SETTING_REQUIRE_CUSTOMER_PHONE,
    label: "fields.requireCustomerPhone.label",
    description: {
      en: "Require customer phone number when creating orders",
      ar: "طلب رقم هاتف العميل عند إنشاء الطلبات",
    },
    type: "boolean",
    defaultValue: true,
  },
  {
    id: "allowed-medicine-forms",
    category: "orders",
    key: SETTING_ALLOWED_MEDICINE_FORMS,
    label: "fields.allowedMedicineForms.label",
    description: {
      en: "Allowed pharmaceutical forms for medicines",
      ar: "الأشكال الصيدلانية المسموح بها للأدوية",
    },
    type: "multiselect",
    defaultValue: MEDICINE_FORMS,
    options: MEDICINE_FORMS.map((form) => ({ value: form, label: form })),
  },
  {
    id: "max-medicines-per-order",
    category: "orders",
    key: SETTING_MAX_MEDICINES_PER_ORDER,
    label: "fields.maxMedicinesPerOrder.label",
    description: {
      en: "Maximum number of medicines allowed per order",
      ar: "الحد الأقصى لعدد الأدوية المسموح بها في الطلب الواحد",
    },
    type: "number",
    defaultValue: 10,
    min: 1,
    max: 50,
  },

  // ========== Suppliers Settings ==========
  {
    id: "min-supplier-rating",
    category: "suppliers",
    key: SETTING_MIN_SUPPLIER_RATING,
    label: "fields.minSupplierRating.label",
    description: {
      en: "Minimum acceptable rating for suppliers",
      ar: "الحد الأدنى للتقييم المقبول للموردين",
    },
    type: "number",
    defaultValue: 3,
    min: 1,
    max: 5,
  },
  {
    id: "max-delivery-days",
    category: "suppliers",
    key: SETTING_MAX_DELIVERY_DAYS,
    label: "fields.maxDeliveryDays.label",
    description: {
      en: "Maximum delivery time in days",
      ar: "الحد الأقصى لوقت التسليم بالأيام",
    },
    type: "number",
    defaultValue: 7,
    min: 1,
    max: 30,
  },
  {
    id: "require-supplier-email",
    category: "suppliers",
    key: SETTING_REQUIRE_SUPPLIER_EMAIL,
    label: "fields.requireSupplierEmail.label",
    description: {
      en: "Require email address when adding suppliers",
      ar: "طلب عنوان البريد الإلكتروني عند إضافة الموردين",
    },
    type: "boolean",
    defaultValue: false,
  },

  // ========== Alerts Settings ==========
  {
    id: "enable-alerts",
    category: "alerts",
    key: SETTING_ENABLE_ALERTS,
    label: "fields.enableAlerts.label",
    description: {
      en: "Enable system alerts for orders",
      ar: "تفعيل تنبيهات النظام للطلبات",
    },
    type: "boolean",
    defaultValue: true,
  },
  {
    id: "old-order-threshold",
    category: "alerts",
    key: SETTING_OLD_ORDER_THRESHOLD,
    label: "fields.oldOrderThreshold.label",
    description: {
      en: "Number of days before an order is considered old",
      ar: "عدد الأيام قبل اعتبار الطلب قديماً",
    },
    type: "number",
    defaultValue: 7,
    min: 1,
    max: 30,
  },
  {
    id: "pickup-reminder-days",
    category: "alerts",
    key: SETTING_PICKUP_REMINDER_DAYS,
    label: "fields.pickupReminderDays.label",
    description: {
      en: "Days before sending pickup reminder",
      ar: "الأيام قبل إرسال تذكير الاستلام",
    },
    type: "number",
    defaultValue: 3,
    min: 1,
    max: 14,
  },
  {
    id: "alert-check-interval",
    category: "alerts",
    key: SETTING_ALERT_CHECK_INTERVAL,
    label: "fields.alertCheckInterval.label",
    description: {
      en: "Alert check interval in minutes",
      ar: "فترة فحص التنبيهات بالدقائق",
    },
    type: "number",
    defaultValue: 30,
    min: 5,
    max: 120,
  },

  // ========== Notifications Settings ==========
  {
    id: "enable-notifications",
    category: "notifications",
    key: SETTING_ENABLE_NOTIFICATIONS,
    label: "fields.enableNotifications.label",
    description: {
      en: "Enable browser notifications",
      ar: "تفعيل إشعارات المتصفح",
    },
    type: "boolean",
    defaultValue: true,
  },
  {
    id: "notification-sound",
    category: "notifications",
    key: SETTING_NOTIFICATION_SOUND,
    label: "fields.notificationSound.label",
    description: {
      en: "Play sound with notifications",
      ar: "تشغيل الصوت مع الإشعارات",
    },
    type: "boolean",
    defaultValue: true,
  },
  {
    id: "notify-on-new-order",
    category: "notifications",
    key: SETTING_NOTIFY_ON_NEW_ORDER,
    label: "fields.notifyOnNewOrder.label",
    description: {
      en: "Notify when a new order is created",
      ar: "الإشعار عند إنشاء طلب جديد",
    },
    type: "boolean",
    defaultValue: true,
  },
  {
    id: "notify-on-status-change",
    category: "notifications",
    key: SETTING_NOTIFY_ON_STATUS_CHANGE,
    label: "fields.notifyOnStatusChange.label",
    description: {
      en: "Notify when order status changes",
      ar: "الإشعار عند تغيير حالة الطلب",
    },
    type: "boolean",
    defaultValue: true,
  },

  // ========== Appearance Settings ==========
  {
    id: "default-theme",
    category: "appearance",
    key: SETTING_DEFAULT_THEME,
    label: "fields.defaultTheme.label",
    description: {
      en: "Default color theme for the application",
      ar: "المظهر الافتراضي للتطبيق",
    },
    type: "select",
    defaultValue: "system",
    options: [
      { value: "light", label: "fields.defaultTheme.options.light" },
      { value: "dark", label: "fields.defaultTheme.options.dark" },
      { value: "system", label: "fields.defaultTheme.options.system" },
    ],
  },
  {
    id: "default-language",
    category: "appearance",
    key: SETTING_DEFAULT_LANGUAGE,
    label: "fields.defaultLanguage.label",
    description: {
      en: "Default language for the application",
      ar: "اللغة الافتراضية للتطبيق",
    },
    type: "select",
    defaultValue: "en",
    options: [
      { value: "en", label: "fields.defaultLanguage.options.en" },
      { value: "ar", label: "fields.defaultLanguage.options.ar" },
    ],
  },
  {
    id: "sidebar-default-state",
    category: "appearance",
    key: SETTING_SIDEBAR_DEFAULT_STATE,
    label: "fields.sidebarDefaultState.label",
    description: {
      en: "Default state of the sidebar",
      ar: "الحالة الافتراضية للشريط الجانبي",
    },
    type: "select",
    defaultValue: "open",
    options: [
      {
        value: "open",
        label: "fields.sidebarDefaultState.options.open",
      },
      {
        value: "collapsed",
        label: "fields.sidebarDefaultState.options.collapsed",
      },
    ],
  },
  {
    id: "items-per-page",
    category: "appearance",
    key: SETTING_ITEMS_PER_PAGE,
    label: "fields.itemsPerPage.label",
    description: {
      en: "Number of items to display per page",
      ar: "عدد العناصر المعروضة في كل صفحة",
    },
    type: "number",
    defaultValue: 20,
    min: 10,
    max: 100,
  },
  {
    id: "inventory-view-mode",
    category: "appearance",
    key: SETTING_INVENTORY_VIEW_MODE,
    label: "fields.inventoryViewMode.label",
    description: {
      en: "Default view mode for inventory page (table or grid)",
      ar: "وضع العرض الافتراضي لصفحة المخزون (جدول أو شبكة)",
    },
    type: "select",
    defaultValue: "table",
    options: [
      { value: "table", label: "fields.inventoryViewMode.options.table" },
      { value: "grid", label: "fields.inventoryViewMode.options.grid" },
    ],
  },

  // ========== System Settings ==========
  {
    id: "enable-dev-mode",
    category: "system",
    key: SETTING_ENABLE_DEV_MODE,
    label: "fields.enableDevMode.label",
    description: {
      en: "Enable developer mode with additional debugging features",
      ar: "تفعيل وضع المطور مع ميزات التصحيح الإضافية",
    },
    type: "boolean",
    defaultValue: false,
  },
  {
    id: "auto-backup",
    category: "system",
    key: SETTING_AUTO_BACKUP,
    label: "fields.autoBackup.label",
    description: {
      en: "Automatically backup database",
      ar: "النسخ الاحتياطي التلقائي لقاعدة البيانات",
    },
    type: "boolean",
    defaultValue: true,
  },
  {
    id: "backup-interval-days",
    category: "system",
    key: SETTING_BACKUP_INTERVAL_DAYS,
    label: "fields.backupIntervalDays.label",
    description: {
      en: "Number of days between automatic backups",
      ar: "عدد الأيام بين النسخ الاحتياطية التلقائية",
    },
    type: "number",
    defaultValue: 7,
    min: 1,
    max: 30,
  },
];

// ========================================
// SETTINGS CATEGORIES
// ========================================

export const SETTINGS_CATEGORIES = {
  general: {
    label: "categories.general.label",
    description: "categories.general.description",
    icon: "Settings",
  },
  orders: {
    label: "categories.orders.label",
    description: "categories.orders.description",
    icon: "Package",
  },
  suppliers: {
    label: "categories.suppliers.label",
    description: "categories.suppliers.description",
    icon: "Users",
  },
  alerts: {
    label: "categories.alerts.label",
    description: "categories.alerts.description",
    icon: "Bell",
  },
  notifications: {
    label: "categories.notifications.label",
    description: "categories.notifications.description",
    icon: "MessageSquare",
  },
  appearance: {
    label: "categories.appearance.label",
    description: "categories.appearance.description",
    icon: "Palette",
  },
  system: {
    label: "categories.system.label",
    description: "categories.system.description",
    icon: "Cog",
  },
} as const;

// ========================================
// SETTINGS HELPER FUNCTIONS
// ========================================

// Get default value for a specific setting
export function getDefaultValue(key: SettingKey): unknown {
  const setting = SETTINGS_DEFINITIONS.find((s) => s.key === key);
  return setting?.defaultValue;
}

// Get setting definition by key
export function getSettingDefinition(
  key: SettingKey,
): SettingDefinition | undefined {
  return SETTINGS_DEFINITIONS.find((s) => s.key === key);
}

// Get all default values
export function getAllDefaultValues(): Record<string, unknown> {
  return SETTINGS_DEFINITIONS.reduce(
    (acc, setting) => {
      acc[setting.key] = setting.defaultValue;
      return acc;
    },
    {} as Record<string, unknown>,
  );
}
