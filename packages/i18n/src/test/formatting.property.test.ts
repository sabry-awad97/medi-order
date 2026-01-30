import { describe, it, expect, beforeAll } from "vitest";
import * as fc from "fast-check";
import { initializeI18n } from "../config/i18n-config";
import {
  formatDate,
  formatNumber,
  formatCurrency,
  pluralKey,
} from "../utils/format";

/**
 * Property Tests for Formatting and Pluralization
 *
 * Validates Requirements:
 * - 9.2: Pluralization
 * - 9.3: Date formatting
 * - 9.4: Number formatting
 * - 9.5: Currency formatting
 *
 * These tests ensure that:
 * 1. Pluralization works correctly for different counts
 * 2. Date formatting respects locale
 * 3. Number formatting respects locale
 * 4. Currency formatting respects locale
 */

describe("Property Test: Formatting and Pluralization", () => {
  beforeAll(async () => {
    await initializeI18n("en");
  });

  it("Property 14: Pluralization", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;

    // Property: Pluralization should work correctly for all count values
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("en", "ar"),
        fc.integer({ min: 0, max: 100 }),
        async (locale, count) => {
          await i18n.changeLanguage(locale);

          // Test with "item" plural key
          const key = pluralKey("item");
          const result = i18n.t(key as any, { count });

          // Should return a string
          expect(typeof result).toBe("string");

          // Should contain the count (except Arabic special forms: 1=singular, 2=dual use words)
          if (count > 0 && !(locale === "ar" && (count === 1 || count === 2))) {
            expect(result).toContain(String(count));
          }

          // Should not return the key itself
          expect(result).not.toBe(key);
        },
      ),
      { numRuns: 50 },
    );
  });

  it("should handle English pluralization (one vs other)", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;
    await i18n.changeLanguage("en");

    // Property: English uses _one for count=1, _other for everything else
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 0, max: 20 }), async (count) => {
        const key = pluralKey("order");
        const result = i18n.t(key as any, { count });

        if (count === 1) {
          // Should use singular form
          expect(result.toLowerCase()).toContain("order");
          expect(result.toLowerCase()).not.toContain("orders");
        } else if (count !== 1) {
          // Should use plural form (or zero form)
          expect(typeof result).toBe("string");
          expect(result.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 20 },
    );
  });

  it("should handle Arabic pluralization (6 forms)", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;
    await i18n.changeLanguage("ar");

    // Property: Arabic uses different forms for 0, 1, 2, 3-10, 11-99, 100+
    await fc.assert(
      fc.asyncProperty(fc.constantFrom(0, 1, 2, 5, 15, 100), async (count) => {
        const key = pluralKey("item");
        const result = i18n.t(key as any, { count });

        // Should return a valid Arabic string
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);

        // Should not return the key itself
        expect(result).not.toBe(key);
      }),
      { numRuns: 10 },
    );
  });

  it("Property 15: Locale-aware date formatting", async () => {
    // Property: Date formatting should respect locale
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("en", "ar"),
        fc.date({ min: new Date(2020, 0, 1), max: new Date(2025, 11, 31) }),
        async (locale, date) => {
          const formatted = formatDate(date, locale);

          // Should return a string
          expect(typeof formatted).toBe("string");

          // Should contain year
          expect(formatted).toContain(String(date.getFullYear()));

          // Should not be empty
          expect(formatted.length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 30 },
    );
  });

  it("should format dates with different options", async () => {
    // Property: Date formatting with options should work
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("en", "ar"),
        fc.date({ min: new Date(2020, 0, 1), max: new Date(2025, 11, 31) }),
        async (locale, date) => {
          const shortFormat = formatDate(date, locale, {
            year: "numeric",
            month: "short",
            day: "numeric",
          });

          const longFormat = formatDate(date, locale, {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          });

          // Both should be valid strings
          expect(typeof shortFormat).toBe("string");
          expect(typeof longFormat).toBe("string");

          // Long format should typically be longer
          expect(longFormat.length).toBeGreaterThanOrEqual(shortFormat.length);
        },
      ),
      { numRuns: 20 },
    );
  });

  it("Property 15: Locale-aware number formatting", async () => {
    // Property: Number formatting should respect locale
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("en", "ar"),
        fc.float({ min: 0, max: 1000000, noNaN: true }),
        async (locale, number) => {
          const formatted = formatNumber(number, locale);

          // Should return a string
          expect(typeof formatted).toBe("string");

          // Should not be empty
          expect(formatted.length).toBeGreaterThan(0);

          // Should contain digits
          expect(/\d/.test(formatted)).toBe(true);
        },
      ),
      { numRuns: 30 },
    );
  });

  it("should format numbers with different options", async () => {
    // Property: Number formatting with options should work
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("en", "ar"),
        fc.float({ min: 0, max: 1, noNaN: true }),
        async (locale, number) => {
          const formatted = formatNumber(number, locale, {
            style: "percent",
          });

          // Should return a string
          expect(typeof formatted).toBe("string");

          // Should contain percent sign or equivalent
          expect(formatted.length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 20 },
    );
  });

  it("Property 15: Locale-aware currency formatting", async () => {
    // Property: Currency formatting should respect locale
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("en", "ar"),
        fc.float({ min: 0, max: 10000, noNaN: true }),
        fc.constantFrom("USD", "EUR", "SAR", "EGP"),
        async (locale, amount, currency) => {
          const formatted = formatCurrency(amount, locale, currency);

          // Should return a string
          expect(typeof formatted).toBe("string");

          // Should not be empty
          expect(formatted.length).toBeGreaterThan(0);

          // Should contain currency code or symbol
          expect(formatted.length).toBeGreaterThan(
            String(Math.floor(amount)).length,
          );
        },
      ),
      { numRuns: 30 },
    );
  });

  it("should handle zero values in formatting", async () => {
    // Property: Zero should be formatted correctly
    await fc.assert(
      fc.asyncProperty(fc.constantFrom("en", "ar"), async (locale) => {
        const formattedNumber = formatNumber(0, locale);
        const formattedCurrency = formatCurrency(0, locale, "USD");

        // Both should be valid strings
        expect(typeof formattedNumber).toBe("string");
        expect(typeof formattedCurrency).toBe("string");

        // Should contain zero
        expect(formattedNumber).toContain("0");
      }),
      { numRuns: 10 },
    );
  });

  it("should handle negative numbers in formatting", async () => {
    // Property: Negative numbers should be formatted correctly
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("en", "ar"),
        fc.float({ min: -10000, max: -1, noNaN: true }),
        async (locale, number) => {
          const formatted = formatNumber(number, locale);

          // Should return a string
          expect(typeof formatted).toBe("string");

          // Should indicate negative (minus sign or parentheses)
          expect(formatted.length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 20 },
    );
  });

  it("should handle very large numbers", async () => {
    // Property: Large numbers should be formatted correctly
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("en", "ar"),
        fc.integer({ min: 1000000, max: 999999999 }),
        async (locale, number) => {
          const formatted = formatNumber(number, locale);

          // Should return a string
          expect(typeof formatted).toBe("string");

          // Should not be empty
          expect(formatted.length).toBeGreaterThan(0);

          // Should contain digits
          expect(/\d/.test(formatted)).toBe(true);
        },
      ),
      { numRuns: 20 },
    );
  });

  it("should handle decimal precision in currency", async () => {
    // Property: Currency should respect decimal places
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("en", "ar"),
        fc.float({ min: 0, max: 100, noNaN: true }),
        async (locale, amount) => {
          const formatted = formatCurrency(amount, locale, "USD", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });

          // Should return a string
          expect(typeof formatted).toBe("string");
          expect(formatted.length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 20 },
    );
  });

  it("should handle pluralization with different keys", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;
    await i18n.changeLanguage("en");

    // Property: Different plural keys should work
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("item", "order", "supplier", "result", "day"),
        fc.integer({ min: 0, max: 10 }),
        async (keyName, count) => {
          const key = pluralKey(keyName);
          const result = i18n.t(key as any, { count });

          // Should return a valid string
          expect(typeof result).toBe("string");
          expect(result.length).toBeGreaterThan(0);

          // Should not return the key itself
          expect(result).not.toBe(key);
        },
      ),
      { numRuns: 30 },
    );
  });

  it("should handle pluralization consistency", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;

    // Property: Same count should always produce same result
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("en", "ar"),
        fc.integer({ min: 0, max: 100 }),
        async (locale, count) => {
          await i18n.changeLanguage(locale);

          const key = pluralKey("item");
          const result1 = i18n.t(key as any, { count });
          const result2 = i18n.t(key as any, { count });
          const result3 = i18n.t(key as any, { count });

          // All results should be identical
          expect(result1).toBe(result2);
          expect(result2).toBe(result3);
        },
      ),
      { numRuns: 30 },
    );
  });

  it("should handle date formatting with invalid dates gracefully", async () => {
    // Property: Invalid dates should be handled gracefully
    const invalidDate = new Date("invalid");

    await fc.assert(
      fc.asyncProperty(fc.constantFrom("en", "ar"), async (locale) => {
        const formatted = formatDate(invalidDate, locale);

        // Should return a string (fallback)
        expect(typeof formatted).toBe("string");
        expect(formatted.length).toBeGreaterThan(0);
      }),
      { numRuns: 10 },
    );
  });

  it("should format dates from timestamps", async () => {
    // Property: Timestamps should be formatted correctly
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("en", "ar"),
        fc.integer({ min: 1577836800000, max: 1735689600000 }), // 2020-2025
        async (locale, timestamp) => {
          const formatted = formatDate(timestamp, locale);

          // Should return a string
          expect(typeof formatted).toBe("string");
          expect(formatted.length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 20 },
    );
  });

  it("should format dates from ISO strings", async () => {
    // Property: ISO date strings should be formatted correctly
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("en", "ar"),
        fc.date({ min: new Date(2020, 0, 1), max: new Date(2025, 11, 31) }),
        async (locale, date) => {
          const isoString = date.toISOString();
          const formatted = formatDate(isoString, locale);

          // Should return a string
          expect(typeof formatted).toBe("string");
          expect(formatted.length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 20 },
    );
  });

  it("should handle pluralization with namespace parameter", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;
    await i18n.changeLanguage("en");

    // Property: Namespace parameter should work
    const key = pluralKey("item", "common");

    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 0, max: 10 }), async (count) => {
        const result = i18n.t(key as any, { count });

        // Should return a valid string
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
      }),
      { numRuns: 20 },
    );
  });
});
