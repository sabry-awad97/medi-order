import type { Locale } from "../types";

/**
 * Format a date according to the current locale
 *
 * @param date - The date to format
 * @param locale - The locale to use for formatting
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | number | string,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions,
): string {
  const dateObj =
    typeof date === "string" || typeof date === "number"
      ? new Date(date)
      : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  };

  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateObj.toLocaleDateString();
  }
}

/**
 * Format a number according to the current locale
 *
 * @param value - The number to format
 * @param locale - The locale to use for formatting
 * @param options - Intl.NumberFormat options
 * @returns Formatted number string
 */
export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions,
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(value);
  } catch (error) {
    console.error("Error formatting number:", error);
    return value.toString();
  }
}

/**
 * Format a currency value according to the current locale
 *
 * @param value - The currency value to format
 * @param locale - The locale to use for formatting
 * @param currency - The currency code (e.g., "USD", "EUR", "SAR")
 * @param options - Additional Intl.NumberFormat options
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  locale: Locale,
  currency: string = "USD",
  options?: Intl.NumberFormatOptions,
): string {
  const defaultOptions: Intl.NumberFormatOptions = {
    style: "currency",
    currency,
    ...options,
  };

  try {
    return new Intl.NumberFormat(locale, defaultOptions).format(value);
  } catch (error) {
    console.error("Error formatting currency:", error);
    return `${currency} ${value}`;
  }
}

/**
 * Pluralization utility for i18n
 *
 * Provides a helper function to generate plural translation keys
 * that work with i18next's pluralization system.
 *
 * @example
 * ```ts
 * const { t } = useTranslation();
 * const itemCount = 5;
 * const text = t(pluralKey('item'), { count: itemCount }); // "5 items"
 * ```
 */

/**
 * Generate a plural translation key for use with i18next
 *
 * i18next automatically handles pluralization by appending suffixes
 * like _one, _other, _zero, _two, _few, _many based on the count
 * and the language's plural rules.
 *
 * @param key - Base translation key (e.g., "item", "order")
 * @param namespace - Optional namespace (defaults to "common")
 * @returns The base key to use with t() function along with count parameter
 *
 * @example
 * ```ts
 * // English: uses _one and _other
 * t(pluralKey('item'), { count: 1 }) // "1 item"
 * t(pluralKey('item'), { count: 5 }) // "5 items"
 *
 * // Arabic: uses _zero, _one, _two, _few, _many, _other
 * t(pluralKey('item'), { count: 0 }) // "لا توجد عناصر"
 * t(pluralKey('item'), { count: 1 }) // "عنصر واحد"
 * t(pluralKey('item'), { count: 2 }) // "عنصران"
 * t(pluralKey('item'), { count: 5 }) // "5 عناصر"
 * ```
 */
export function pluralKey(key: string, namespace: string = "common"): string {
  // i18next handles the plural suffix automatically based on count
  // We just need to return the base key with namespace
  return `${namespace}:plurals.${key}`;
}
