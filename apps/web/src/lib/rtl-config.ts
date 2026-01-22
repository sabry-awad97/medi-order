/**
 * إعدادات RTL للنظام
 * هذا الملف يحتوي على الإعدادات الخاصة بدعم اللغة العربية واتجاه RTL
 */

export const RTL_CONFIG = {
  // اتجاه النص
  direction: "rtl" as const,

  // اللغة
  locale: "ar",

  // الخطوط العربية
  fonts: {
    primary: "Cairo",
    secondary: "Noto Sans Arabic",
    fallback: "sans-serif",
  },

  // تنسيقات التاريخ
  dateFormats: {
    short: "d/M/yyyy",
    medium: "d MMMM yyyy",
    long: "d MMMM yyyy - h:mm a",
    full: "EEEE، d MMMM yyyy - h:mm a",
  },
} as const;

/**
 * دالة مساعدة لتطبيق اتجاه RTL على عنصر
 */
export function applyRTL(element: HTMLElement) {
  element.dir = RTL_CONFIG.direction;
  element.lang = RTL_CONFIG.locale;
}

/**
 * دالة مساعدة للحصول على اتجاه النص المعاكس
 */
export function getOppositeDirection() {
  return RTL_CONFIG.direction === "rtl" ? "ltr" : "rtl";
}
