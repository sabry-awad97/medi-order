// Settings definitions for the system
import type { SettingDefinition } from "./types-settings";
import { MEDICINE_FORMS } from "./constants";

export const SETTINGS_DEFINITIONS: SettingDefinition[] = [
  // ========== General Settings ==========
  {
    id: "pharmacy-name",
    category: "general",
    key: "pharmacyName",
    label: "fields.pharmacyName.label",
    description: "fields.pharmacyName.description",
    type: "text",
    defaultValue: "Pharmacy",
    required: true,
  },
  {
    id: "pharmacy-phone",
    category: "general",
    key: "pharmacyPhone",
    label: "fields.pharmacyPhone.label",
    description: "fields.pharmacyPhone.description",
    type: "text",
    defaultValue: "",
  },
  {
    id: "pharmacy-address",
    category: "general",
    key: "pharmacyAddress",
    label: "fields.pharmacyAddress.label",
    description: "fields.pharmacyAddress.description",
    type: "text",
    defaultValue: "",
  },
  {
    id: "working-hours",
    category: "general",
    key: "workingHours",
    label: "fields.workingHours.label",
    description: "fields.workingHours.description",
    type: "text",
    defaultValue: "9 AM - 10 PM",
  },

  // ========== Orders Settings ==========
  {
    id: "default-order-status",
    category: "orders",
    key: "defaultOrderStatus",
    label: "fields.defaultOrderStatus.label",
    description: "fields.defaultOrderStatus.description",
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
    key: "autoArchiveDays",
    label: "fields.autoArchiveDays.label",
    description: "fields.autoArchiveDays.description",
    type: "number",
    defaultValue: 30,
    min: 0,
    max: 365,
  },
  {
    id: "require-customer-phone",
    category: "orders",
    key: "requireCustomerPhone",
    label: "fields.requireCustomerPhone.label",
    description: "fields.requireCustomerPhone.description",
    type: "boolean",
    defaultValue: true,
  },
  {
    id: "allowed-medicine-forms",
    category: "orders",
    key: "allowedMedicineForms",
    label: "fields.allowedMedicineForms.label",
    description: "fields.allowedMedicineForms.description",
    type: "multiselect",
    defaultValue: MEDICINE_FORMS,
    options: MEDICINE_FORMS.map((form) => ({ value: form, label: form })),
  },
  {
    id: "max-medicines-per-order",
    category: "orders",
    key: "maxMedicinesPerOrder",
    label: "fields.maxMedicinesPerOrder.label",
    description: "fields.maxMedicinesPerOrder.description",
    type: "number",
    defaultValue: 10,
    min: 1,
    max: 50,
  },

  // ========== Suppliers Settings ==========
  {
    id: "min-supplier-rating",
    category: "suppliers",
    key: "minSupplierRating",
    label: "fields.minSupplierRating.label",
    description: "fields.minSupplierRating.description",
    type: "number",
    defaultValue: 3,
    min: 1,
    max: 5,
  },
  {
    id: "max-delivery-days",
    category: "suppliers",
    key: "maxDeliveryDays",
    label: "fields.maxDeliveryDays.label",
    description: "fields.maxDeliveryDays.description",
    type: "number",
    defaultValue: 7,
    min: 1,
    max: 30,
  },
  {
    id: "require-supplier-email",
    category: "suppliers",
    key: "requireSupplierEmail",
    label: "fields.requireSupplierEmail.label",
    description: "fields.requireSupplierEmail.description",
    type: "boolean",
    defaultValue: false,
  },

  // ========== Alerts Settings ==========
  {
    id: "enable-alerts",
    category: "alerts",
    key: "enableAlerts",
    label: "fields.enableAlerts.label",
    description: "fields.enableAlerts.description",
    type: "boolean",
    defaultValue: true,
  },
  {
    id: "old-order-threshold",
    category: "alerts",
    key: "oldOrderThreshold",
    label: "fields.oldOrderThreshold.label",
    description: "fields.oldOrderThreshold.description",
    type: "number",
    defaultValue: 7,
    min: 1,
    max: 30,
  },
  {
    id: "pickup-reminder-days",
    category: "alerts",
    key: "pickupReminderDays",
    label: "fields.pickupReminderDays.label",
    description: "fields.pickupReminderDays.description",
    type: "number",
    defaultValue: 3,
    min: 1,
    max: 14,
  },
  {
    id: "alert-check-interval",
    category: "alerts",
    key: "alertCheckInterval",
    label: "fields.alertCheckInterval.label",
    description: "fields.alertCheckInterval.description",
    type: "number",
    defaultValue: 30,
    min: 5,
    max: 120,
  },

  // ========== Notifications Settings ==========
  {
    id: "enable-notifications",
    category: "notifications",
    key: "enableNotifications",
    label: "fields.enableNotifications.label",
    description: "fields.enableNotifications.description",
    type: "boolean",
    defaultValue: true,
  },
  {
    id: "notification-sound",
    category: "notifications",
    key: "notificationSound",
    label: "fields.notificationSound.label",
    description: "fields.notificationSound.description",
    type: "boolean",
    defaultValue: true,
  },
  {
    id: "notify-on-new-order",
    category: "notifications",
    key: "notifyOnNewOrder",
    label: "fields.notifyOnNewOrder.label",
    description: "fields.notifyOnNewOrder.description",
    type: "boolean",
    defaultValue: true,
  },
  {
    id: "notify-on-status-change",
    category: "notifications",
    key: "notifyOnStatusChange",
    label: "fields.notifyOnStatusChange.label",
    description: "fields.notifyOnStatusChange.description",
    type: "boolean",
    defaultValue: true,
  },

  // ========== Appearance Settings ==========
  {
    id: "default-theme",
    category: "appearance",
    key: "defaultTheme",
    label: "fields.defaultTheme.label",
    description: "fields.defaultTheme.description",
    type: "select",
    defaultValue: "system",
    options: [
      { value: "light", label: "fields.defaultTheme.options.light" },
      { value: "dark", label: "fields.defaultTheme.options.dark" },
      { value: "system", label: "fields.defaultTheme.options.system" },
    ],
  },
  {
    id: "sidebar-default-state",
    category: "appearance",
    key: "sidebarDefaultState",
    label: "fields.sidebarDefaultState.label",
    description: "fields.sidebarDefaultState.description",
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
    key: "itemsPerPage",
    label: "fields.itemsPerPage.label",
    description: "fields.itemsPerPage.description",
    type: "number",
    defaultValue: 20,
    min: 10,
    max: 100,
  },

  // ========== System Settings ==========
  {
    id: "enable-dev-mode",
    category: "system",
    key: "enableDevMode",
    label: "fields.enableDevMode.label",
    description: "fields.enableDevMode.description",
    type: "boolean",
    defaultValue: false,
  },
  {
    id: "auto-backup",
    category: "system",
    key: "autoBackup",
    label: "fields.autoBackup.label",
    description: "fields.autoBackup.description",
    type: "boolean",
    defaultValue: true,
  },
  {
    id: "backup-interval-days",
    category: "system",
    key: "backupIntervalDays",
    label: "fields.backupIntervalDays.label",
    description: "fields.backupIntervalDays.description",
    type: "number",
    defaultValue: 7,
    min: 1,
    max: 30,
  },
];

// Settings categories
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

// الحصول على القيمة الافتراضية لإعداد معين
export function getDefaultValue(key: string): unknown {
  const setting = SETTINGS_DEFINITIONS.find((s) => s.key === key);
  return setting?.defaultValue;
}

// الحصول على جميع القيم الافتراضية
export function getAllDefaultValues(): Record<string, unknown> {
  return SETTINGS_DEFINITIONS.reduce(
    (acc, setting) => {
      acc[setting.key] = setting.defaultValue;
      return acc;
    },
    {} as Record<string, unknown>,
  );
}
