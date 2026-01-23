/**
 * Validation Utilities
 *
 * دوال مساعدة للتحقق من صحة البيانات
 */

/**
 * التحقق من رقم الهاتف السعودي
 */
export function isValidSaudiPhone(phone: string): boolean {
  // يجب أن يبدأ بـ 05 ويتكون من 10 أرقام
  const phoneRegex = /^05\d{8}$/;
  return phoneRegex.test(phone);
}

/**
 * التحقق من البريد الإلكتروني
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * تنظيف رقم الهاتف
 */
export function sanitizePhone(phone: string): string {
  // إزالة جميع الأحرف غير الرقمية
  return phone.replace(/\D/g, "");
}

/**
 * تنسيق رقم الهاتف للعرض
 */
export function formatPhone(phone: string): string {
  const cleaned = sanitizePhone(phone);

  if (cleaned.length === 10 && cleaned.startsWith("05")) {
    // تنسيق: 05XX XXX XXXX
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }

  return phone;
}

/**
 * التحقق من قوة كلمة المرور (للاستخدام المستقبلي)
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("يجب أن تكون كلمة المرور 8 أحرف على الأقل");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("يجب أن تحتوي على حرف كبير واحد على الأقل");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("يجب أن تحتوي على حرف صغير واحد على الأقل");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("يجب أن تحتوي على رقم واحد على الأقل");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("يجب أن تحتوي على رمز خاص واحد على الأقل");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * تنظيف النص من HTML والسكريبتات
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}
