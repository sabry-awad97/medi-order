// تعريفات الإعدادات الافتراضية للنظام
import type { SettingDefinition } from "./types-settings";
import { MEDICINE_FORMS } from "./constants";

export const SETTINGS_DEFINITIONS: SettingDefinition[] = [
  // ========== الإعدادات العامة ==========
  {
    id: "pharmacy-name",
    category: "general",
    key: "pharmacyName",
    label: "اسم الصيدلية",
    description: "الاسم الرسمي للصيدلية الذي يظهر في النظام",
    type: "text",
    defaultValue: "الصيدلية",
    required: true,
  },
  {
    id: "pharmacy-phone",
    category: "general",
    key: "pharmacyPhone",
    label: "رقم هاتف الصيدلية",
    description: "رقم الهاتف الرئيسي للصيدلية",
    type: "text",
    defaultValue: "",
  },
  {
    id: "pharmacy-address",
    category: "general",
    key: "pharmacyAddress",
    label: "عنوان الصيدلية",
    description: "العنوان الكامل للصيدلية",
    type: "text",
    defaultValue: "",
  },
  {
    id: "working-hours",
    category: "general",
    key: "workingHours",
    label: "ساعات العمل",
    description: "ساعات عمل الصيدلية",
    type: "text",
    defaultValue: "من 9 صباحاً إلى 10 مساءً",
  },

  // ========== إعدادات الطلبات ==========
  {
    id: "default-order-status",
    category: "orders",
    key: "defaultOrderStatus",
    label: "حالة الطلب الافتراضية",
    description: "الحالة التي يتم تعيينها للطلبات الجديدة",
    type: "select",
    defaultValue: "pending",
    options: [
      { value: "pending", label: "قيد الانتظار" },
      { value: "ordered", label: "تم الطلب" },
    ],
    required: true,
  },
  {
    id: "auto-archive-days",
    category: "orders",
    key: "autoArchiveDays",
    label: "أيام الأرشفة التلقائية",
    description: "عدد الأيام بعد التسليم لأرشفة الطلب تلقائياً (0 = تعطيل)",
    type: "number",
    defaultValue: 30,
    min: 0,
    max: 365,
  },
  {
    id: "require-customer-phone",
    category: "orders",
    key: "requireCustomerPhone",
    label: "إلزامية رقم هاتف العميل",
    description: "هل رقم هاتف العميل إلزامي عند إنشاء طلب؟",
    type: "boolean",
    defaultValue: true,
  },
  {
    id: "allowed-medicine-forms",
    category: "orders",
    key: "allowedMedicineForms",
    label: "أشكال الأدوية المسموحة",
    description: "أشكال الأدوية التي يمكن إضافتها في الطلبات",
    type: "multiselect",
    defaultValue: MEDICINE_FORMS,
    options: MEDICINE_FORMS.map((form) => ({ value: form, label: form })),
  },
  {
    id: "max-medicines-per-order",
    category: "orders",
    key: "maxMedicinesPerOrder",
    label: "الحد الأقصى للأدوية في الطلب",
    description: "أقصى عدد من الأدوية يمكن إضافتها في طلب واحد",
    type: "number",
    defaultValue: 10,
    min: 1,
    max: 50,
  },

  // ========== إعدادات الموردين ==========
  {
    id: "min-supplier-rating",
    category: "suppliers",
    key: "minSupplierRating",
    label: "الحد الأدنى لتقييم المورد",
    description: "أقل تقييم مقبول للموردين (من 1 إلى 5)",
    type: "number",
    defaultValue: 3,
    min: 1,
    max: 5,
  },
  {
    id: "max-delivery-days",
    category: "suppliers",
    key: "maxDeliveryDays",
    label: "الحد الأقصى لأيام التوصيل",
    description: "أقصى عدد أيام مقبول لتوصيل الطلب من المورد",
    type: "number",
    defaultValue: 7,
    min: 1,
    max: 30,
  },
  {
    id: "require-supplier-email",
    category: "suppliers",
    key: "requireSupplierEmail",
    label: "إلزامية البريد الإلكتروني للمورد",
    description: "هل البريد الإلكتروني إلزامي عند إضافة مورد؟",
    type: "boolean",
    defaultValue: false,
  },

  // ========== إعدادات التنبيهات ==========
  {
    id: "enable-alerts",
    category: "alerts",
    key: "enableAlerts",
    label: "تفعيل التنبيهات",
    description: "تفعيل نظام التنبيهات للطلبات",
    type: "boolean",
    defaultValue: true,
  },
  {
    id: "old-order-threshold",
    category: "alerts",
    key: "oldOrderThreshold",
    label: "عتبة الطلبات القديمة (أيام)",
    description: "عدد الأيام التي بعدها يعتبر الطلب قديماً",
    type: "number",
    defaultValue: 7,
    min: 1,
    max: 30,
  },
  {
    id: "pickup-reminder-days",
    category: "alerts",
    key: "pickupReminderDays",
    label: "تذكير الاستلام (أيام)",
    description: "عدد الأيام بعد الوصول لتذكير العميل بالاستلام",
    type: "number",
    defaultValue: 3,
    min: 1,
    max: 14,
  },
  {
    id: "alert-check-interval",
    category: "alerts",
    key: "alertCheckInterval",
    label: "فترة فحص التنبيهات (دقائق)",
    description: "كل كم دقيقة يتم فحص التنبيهات الجديدة",
    type: "number",
    defaultValue: 30,
    min: 5,
    max: 120,
  },

  // ========== إعدادات الإشعارات ==========
  {
    id: "enable-notifications",
    category: "notifications",
    key: "enableNotifications",
    label: "تفعيل الإشعارات",
    description: "تفعيل إشعارات سطح المكتب",
    type: "boolean",
    defaultValue: true,
  },
  {
    id: "notification-sound",
    category: "notifications",
    key: "notificationSound",
    label: "صوت الإشعارات",
    description: "تشغيل صوت عند ظهور إشعار جديد",
    type: "boolean",
    defaultValue: true,
  },
  {
    id: "notify-on-new-order",
    category: "notifications",
    key: "notifyOnNewOrder",
    label: "إشعار عند طلب جديد",
    description: "إرسال إشعار عند إضافة طلب جديد",
    type: "boolean",
    defaultValue: true,
  },
  {
    id: "notify-on-status-change",
    category: "notifications",
    key: "notifyOnStatusChange",
    label: "إشعار عند تغيير الحالة",
    description: "إرسال إشعار عند تغيير حالة الطلب",
    type: "boolean",
    defaultValue: true,
  },

  // ========== إعدادات المظهر ==========
  {
    id: "default-theme",
    category: "appearance",
    key: "defaultTheme",
    label: "المظهر الافتراضي",
    description: "المظهر الافتراضي للنظام",
    type: "select",
    defaultValue: "system",
    options: [
      { value: "light", label: "فاتح" },
      { value: "dark", label: "داكن" },
      { value: "system", label: "حسب النظام" },
    ],
  },
  {
    id: "sidebar-default-state",
    category: "appearance",
    key: "sidebarDefaultState",
    label: "حالة الشريط الجانبي الافتراضية",
    description: "هل يكون الشريط الجانبي مفتوحاً أو مغلقاً عند بدء التشغيل",
    type: "select",
    defaultValue: "open",
    options: [
      { value: "open", label: "مفتوح" },
      { value: "collapsed", label: "مطوي" },
    ],
  },
  {
    id: "items-per-page",
    category: "appearance",
    key: "itemsPerPage",
    label: "عدد العناصر في الصفحة",
    description: "عدد العناصر المعروضة في كل صفحة",
    type: "number",
    defaultValue: 20,
    min: 10,
    max: 100,
  },

  // ========== إعدادات النظام ==========
  {
    id: "enable-dev-mode",
    category: "system",
    key: "enableDevMode",
    label: "تفعيل وضع المطور",
    description: "إظهار أدوات المطور والبيانات التجريبية",
    type: "boolean",
    defaultValue: false,
  },
  {
    id: "auto-backup",
    category: "system",
    key: "autoBackup",
    label: "النسخ الاحتياطي التلقائي",
    description: "تفعيل النسخ الاحتياطي التلقائي للبيانات",
    type: "boolean",
    defaultValue: true,
  },
  {
    id: "backup-interval-days",
    category: "system",
    key: "backupIntervalDays",
    label: "فترة النسخ الاحتياطي (أيام)",
    description: "كل كم يوم يتم إنشاء نسخة احتياطية",
    type: "number",
    defaultValue: 7,
    min: 1,
    max: 30,
  },
];

// تصنيف الإعدادات حسب الفئة
export const SETTINGS_CATEGORIES = {
  general: {
    label: "الإعدادات العامة",
    description: "معلومات الصيدلية الأساسية",
    icon: "Settings",
  },
  orders: {
    label: "إعدادات الطلبات",
    description: "إدارة سلوك الطلبات والقيود",
    icon: "Package",
  },
  suppliers: {
    label: "إعدادات الموردين",
    description: "معايير وقيود الموردين",
    icon: "Users",
  },
  alerts: {
    label: "إعدادات التنبيهات",
    description: "تخصيص التنبيهات والتذكيرات",
    icon: "Bell",
  },
  notifications: {
    label: "إعدادات الإشعارات",
    description: "إدارة الإشعارات والتنبيهات",
    icon: "MessageSquare",
  },
  appearance: {
    label: "إعدادات المظهر",
    description: "تخصيص واجهة المستخدم",
    icon: "Palette",
  },
  system: {
    label: "إعدادات النظام",
    description: "إعدادات النظام المتقدمة",
    icon: "Cog",
  },
} as const;

// الحصول على القيمة الافتراضية لإعداد معين
export function getDefaultValue(key: string): any {
  const setting = SETTINGS_DEFINITIONS.find((s) => s.key === key);
  return setting?.defaultValue;
}

// الحصول على جميع القيم الافتراضية
export function getAllDefaultValues(): Record<string, any> {
  return SETTINGS_DEFINITIONS.reduce(
    (acc, setting) => {
      acc[setting.key] = setting.defaultValue;
      return acc;
    },
    {} as Record<string, any>,
  );
}
