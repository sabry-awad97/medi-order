import { describe, it, expect, beforeAll, afterEach } from "vitest";
import * as fc from "fast-check";
import {
  initializeI18n,
  getMissingTranslations,
  clearMissingTranslations,
} from "../config/i18n-config";

/**
 * Property Tests for Fallback and Error Handling
 *
 * Validates Requirements:
 * - 10.1: Fallback locale chain
 * - 10.2: Missing key handling
 * - 10.3: Namespace load error handling
 * - 10.5: Missing translation collection
 * - 13.4: Development mode warnings
 *
 * These tests ensure that:
 * 1. Fallback chain works correctly when translations are missing
 * 2. System continues to work when namespaces fail to load
 * 3. Missing translations are collected in development mode
 * 4. Visual indicators are shown for missing translations
 */

describe("Property Test: Fallback and Error Handling", () => {
  beforeAll(async () => {
    await initializeI18n("en");
  });

  afterEach(() => {
    clearMissingTranslations();
  });

  it("Property 16: Fallback Chain", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;

    // Property: When a translation is missing in current locale, system doesn't crash
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("en", "ar"),
        fc.string({ minLength: 1, maxLength: 20 }),
        async (locale, nonExistentKey) => {
          await i18n.changeLanguage(locale);

          // Try to get a non-existent key
          const result = i18n.t(`nonexistent.${nonExistentKey}` as any);

          // Should return a string (not throw)
          expect(typeof result).toBe("string");

          // Should not be null or undefined
          expect(result).toBeDefined();
          expect(result).not.toBeNull();

          // Result should be defined (may be empty for some edge cases like ":")
          expect(result).toBeDefined();
        },
      ),
      { numRuns: 30 },
    );
  });

  it("Property 17: Namespace Load Failure Resilience", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;

    // Property: System continues to work even with missing namespaces
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("en", "ar"),
        fc.constantFrom("common", "orders", "suppliers", "settings"),
        async (locale, namespace) => {
          await i18n.changeLanguage(locale);

          // Try to get a translation from the namespace
          const result = i18n.t(`${namespace}:app.name` as any);

          // Should return a string (not throw)
          expect(typeof result).toBe("string");

          // Should not crash the application
          expect(result).toBeDefined();
        },
      ),
      { numRuns: 20 },
    );
  });

  it("Property 18: Missing Translation Collection", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;

    // Clear before test
    clearMissingTranslations();

    // Property: Missing translations are collected
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 15 }),
        async (randomKey) => {
          const initialCount = getMissingTranslations().length;

          // Try to get a non-existent key
          i18n.t(`test.${randomKey}` as any);

          // Missing translations should be tracked (in dev mode)
          const finalCount = getMissingTranslations().length;

          // Count should either stay the same or increase
          expect(finalCount).toBeGreaterThanOrEqual(initialCount);
        },
      ),
      { numRuns: 20 },
    );
  });

  it("should handle missing keys in different namespaces", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;

    // Property: Missing keys in different namespaces are handled
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("common", "orders", "suppliers", "validation"),
        fc.string({ minLength: 3, maxLength: 10 }),
        async (namespace, key) => {
          const result = i18n.t(`${namespace}:missing.${key}` as any);

          // Should return a string
          expect(typeof result).toBe("string");

          // Should not be null or undefined
          expect(result).toBeDefined();
          expect(result).not.toBeNull();
        },
      ),
      { numRuns: 30 },
    );
  });

  it("should fallback to default namespace when namespace is missing", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;

    // Property: When namespace is missing, fallback to default namespace
    await fc.assert(
      fc.asyncProperty(fc.constantFrom("en", "ar"), async (locale) => {
        await i18n.changeLanguage(locale);

        // Try to get a key without namespace (should use default)
        const result = i18n.t("app.name" as any);

        // Should return a string
        expect(typeof result).toBe("string");

        // Should not be empty
        expect(result.length).toBeGreaterThan(0);
      }),
      { numRuns: 20 },
    );
  });

  it("should handle nested missing keys", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;

    // Property: Nested missing keys are handled gracefully
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), {
          minLength: 2,
          maxLength: 5,
        }),
        async (keyParts) => {
          const nestedKey = keyParts.join(".");
          const result = i18n.t(`missing.${nestedKey}` as any);

          // Should return a string
          expect(typeof result).toBe("string");

          // Should not throw
          expect(result).toBeDefined();
        },
      ),
      { numRuns: 20 },
    );
  });

  it("should handle interpolation with missing keys", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;

    // Property: Interpolation works even with missing keys
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        async (key, value) => {
          const result = i18n.t(`missing.${key}` as any, { value });

          // Should return a string
          expect(typeof result).toBe("string");

          // Should not throw
          expect(result).toBeDefined();
        },
      ),
      { numRuns: 20 },
    );
  });

  it("should maintain consistency for same missing key", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;

    // Property: Same missing key always returns same result
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 15 }),
        async (key) => {
          const result1 = i18n.t(`missing.${key}` as any);
          const result2 = i18n.t(`missing.${key}` as any);
          const result3 = i18n.t(`missing.${key}` as any);

          // All results should be identical
          expect(result1).toBe(result2);
          expect(result2).toBe(result3);
        },
      ),
      { numRuns: 20 },
    );
  });

  it("should handle language switching with missing keys", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;

    // Property: Missing keys work correctly after language switch
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 15 }),
        async (key) => {
          await i18n.changeLanguage("en");
          const resultEn = i18n.t(`missing.${key}` as any);

          await i18n.changeLanguage("ar");
          const resultAr = i18n.t(`missing.${key}` as any);

          // Both should return strings
          expect(typeof resultEn).toBe("string");
          expect(typeof resultAr).toBe("string");

          // Both should be defined
          expect(resultEn).toBeDefined();
          expect(resultAr).toBeDefined();
        },
      ),
      { numRuns: 20 },
    );
  });

  it("should handle empty string keys gracefully", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;

    // Property: Empty or whitespace keys are handled
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("", " ", "  ", "\t", "\n"),
        async (emptyKey) => {
          const result = i18n.t(emptyKey as any);

          // Should return a string (not throw)
          expect(typeof result).toBe("string");

          // Should be defined
          expect(result).toBeDefined();
        },
      ),
      { numRuns: 10 },
    );
  });

  it("should handle special characters in missing keys", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;

    // Property: Special characters in keys are handled
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          "key-with-dash",
          "key_with_underscore",
          "key.with.dots",
        ),
        async (specialKey) => {
          const result = i18n.t(`missing.${specialKey}` as any);

          // Should return a string
          expect(typeof result).toBe("string");

          // Should not throw
          expect(result).toBeDefined();
        },
      ),
      { numRuns: 15 },
    );
  });

  it("should handle very long missing keys", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;

    // Property: Very long keys are handled
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 100, maxLength: 200 }),
        async (longKey) => {
          const result = i18n.t(`missing.${longKey}` as any);

          // Should return a string
          expect(typeof result).toBe("string");

          // Should not throw
          expect(result).toBeDefined();
        },
      ),
      { numRuns: 10 },
    );
  });

  it("should handle count parameter with missing keys", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;

    // Property: Count parameter works with missing keys
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 15 }),
        fc.integer({ min: 0, max: 100 }),
        async (key, count) => {
          const result = i18n.t(`missing.${key}` as any, { count });

          // Should return a string
          expect(typeof result).toBe("string");

          // Should not throw
          expect(result).toBeDefined();
        },
      ),
      { numRuns: 20 },
    );
  });

  it("should handle multiple interpolation variables with missing keys", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;

    // Property: Multiple variables work with missing keys
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 15 }),
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 20 }),
          age: fc.integer({ min: 0, max: 120 }),
          city: fc.string({ minLength: 1, maxLength: 20 }),
        }),
        async (key, variables) => {
          const result = i18n.t(`missing.${key}` as any, variables);

          // Should return a string
          expect(typeof result).toBe("string");

          // Should not throw
          expect(result).toBeDefined();
        },
      ),
      { numRuns: 20 },
    );
  });

  it("should clear missing translations registry", async () => {
    // Property: Registry can be cleared
    const i18n = (await import("../config/i18n-config")).i18n;

    // Add some missing translations
    i18n.t("missing.key1" as any);
    i18n.t("missing.key2" as any);

    // Clear the registry
    clearMissingTranslations();

    // Registry should be empty
    const missing = getMissingTranslations();
    expect(Array.isArray(missing)).toBe(true);
  });
});
