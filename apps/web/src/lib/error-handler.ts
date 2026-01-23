/**
 * Error Handler
 *
 * معالج مركزي للأخطاء مع تسجيل آمن وإشعارات للمستخدم
 */

import { toast } from "sonner";
import { logger } from "./logger";
import { z } from "zod";

export interface ErrorHandlerOptions {
  showToast?: boolean;
  toastMessage?: string;
  logError?: boolean;
  rethrow?: boolean;
}

/**
 * معالج الأخطاء المركزي
 */
export function handleError(
  error: unknown,
  context: string,
  options: ErrorHandlerOptions = {},
): void {
  const {
    showToast = true,
    toastMessage,
    logError = true,
    rethrow = false,
  } = options;

  // تسجيل الخطأ
  if (logError) {
    logger.error(`[${context}]`, error);
  }

  // تحديد رسالة الخطأ
  let message = toastMessage || "حدث خطأ غير متوقع";

  if (error instanceof z.ZodError) {
    const firstError = error.issues[0];
    message = `خطأ في التحقق: ${firstError.message}`;
  } else if (error instanceof Error) {
    message = error.message;
  }

  // عرض إشعار للمستخدم
  if (showToast) {
    toast.error(message);
  }

  // إعادة رمي الخطأ إذا لزم الأمر
  if (rethrow) {
    throw error;
  }
}

/**
 * معالج الأخطاء غير المتزامنة
 */
export async function handleAsyncError<T>(
  fn: () => Promise<T>,
  context: string,
  options: ErrorHandlerOptions = {},
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    handleError(error, context, options);
    return null;
  }
}

/**
 * معالج الأخطاء المتزامنة
 */
export function handleSyncError<T>(
  fn: () => T,
  context: string,
  options: ErrorHandlerOptions = {},
): T | null {
  try {
    return fn();
  } catch (error) {
    handleError(error, context, options);
    return null;
  }
}
