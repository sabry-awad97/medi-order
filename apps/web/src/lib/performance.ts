/**
 * Performance Utilities
 *
 * أدوات لتحسين الأداء ومراقبة الأداء
 */

import { logger } from "./logger";

/**
 * قياس وقت تنفيذ دالة
 */
export async function measurePerformance<T>(
  fn: () => Promise<T>,
  label: string,
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const end = performance.now();
    const duration = end - start;

    logger.debug(`[Performance] ${label}: ${duration.toFixed(2)}ms`);

    return result;
  } catch (error) {
    const end = performance.now();
    const duration = end - start;
    logger.error(
      `[Performance] ${label} failed after ${duration.toFixed(2)}ms`,
      error,
    );
    throw error;
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
