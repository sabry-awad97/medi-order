import { describe, it, expect, beforeAll } from "vitest";
import * as fc from "fast-check";
import { initializeI18n } from "../config/i18n-config";

/**
 * Property Test 1: Nested Translation Key Resolution
 *
 * Validates Requirement 2.4: Type-safe translation keys with autocomplete
 *
 * Property: For any valid nested translation key path in the translation files,
 * the i18n system should correctly resolve the translation value regardless of
 * nesting depth.
 *
 * This test ensures that:
 * 1. Nested keys are correctly resolved using dot notation (e.g., "app.name")
 * 2. The resolution works consistently across different locales
 * 3. Deep nesting is supported without errors
 * 4. Invalid keys return the key itself (fallback behavior)
 */

describe("Property Test: Nested Translation Key Resolution", () => {
  beforeAll(async () => {
    await initializeI18n("en");
  });

  it("should resolve all valid nested keys correctly", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;

    // Define known valid nested keys from our translation files
    const validNestedKeys = [
      { key: "app.name", expected: "Medi Order" },
      { key: "app.tagline", expected: "Medical Supply Management" },
      { key: "navigation.home", expected: "Home" },
      { key: "navigation.orders", expected: "Special Orders" },
      { key: "theme.light", expected: "Light Mode" },
      { key: "actions.save", expected: "Save" },
      { key: "messages.loading", expected: "Loading..." },
      { key: "notFound.title", expected: "Page Not Found" },
      { key: "common.yes", expected: "Yes" },
      { key: "update.available", expected: "Update Available" },
    ];

    // Property: All valid nested keys should resolve to their expected values
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...validNestedKeys),
        async ({ key, expected }) => {
          const result = (i18n.t as any)(key);
          expect(result).toBe(expected);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should resolve nested keys consistently across locales", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;

    // Keys that exist in both English and Arabic
    const commonKeys = [
      "app.name",
      "navigation.home",
      "actions.save",
      "common.yes",
    ];

    // Property: Nested keys should resolve in both locales without errors
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...commonKeys),
        fc.constantFrom("en", "ar"),
        async (key, locale) => {
          await i18n.changeLanguage(locale);
          const result = i18n.t(key as any);

          // Should not return the key itself (which indicates missing translation)
          expect(result).not.toBe(key);
          // Should return a non-empty string
          expect((result as string).length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should handle various nesting depths correctly", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;

    // Test different nesting depths
    const keysByDepth = [
      { depth: 1, key: "loading.default", namespace: "common" },
      { depth: 2, key: "app.name", namespace: "common" },
      { depth: 2, key: "navigation.home", namespace: "common" },
      { depth: 2, key: "messages.loading", namespace: "common" },
    ];

    // Property: Keys at any depth should resolve correctly
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...keysByDepth),
        async ({ key, namespace }) => {
          const result = i18n.t(key as any, { ns: namespace as any });

          // Should resolve to a string
          expect(typeof result).toBe("string");
          // Should not be empty
          expect((result as string).length).toBeGreaterThan(0);
          // Should not return the key itself
          expect(result).not.toBe(key);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should return key for invalid nested paths (fallback behavior)", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;

    // Generate arbitrary invalid key paths
    const invalidKeyArbitrary = fc
      .tuple(
        fc
          .string({ minLength: 3, maxLength: 10 })
          .filter((s) => /^[a-z]+$/.test(s)),
        fc
          .string({ minLength: 3, maxLength: 10 })
          .filter((s) => /^[a-z]+$/.test(s)),
        fc
          .string({ minLength: 3, maxLength: 10 })
          .filter((s) => /^[a-z]+$/.test(s)),
      )
      .map(([a, b, c]) => `${a}.${b}.${c}`);

    // Property: Invalid keys should return the key or a fallback
    await fc.assert(
      fc.asyncProperty(invalidKeyArbitrary, async (invalidKey) => {
        const result = i18n.t(invalidKey as any);

        // For missing keys, should return a string containing the key
        expect(typeof result).toBe("string");
        expect(result).toContain(invalidKey);
      }),
      { numRuns: 50 },
    );
  });

  it("should handle namespace-prefixed nested keys", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;

    // Ensure we're in English
    await i18n.changeLanguage("en");

    // Test keys with explicit namespace prefix
    const namespacedKeys = [
      { key: "common:app.name", expected: "Medi Order" },
      { key: "common:navigation.home", expected: "Home" },
      { key: "common:actions.save", expected: "Save" },
    ];

    // Property: Namespace-prefixed keys should resolve correctly
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...namespacedKeys),
        async ({ key, expected }) => {
          const result = i18n.t(key as any);
          expect(result).toBe(expected);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should maintain type safety with nested key paths", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;

    // Test that nested keys work with different value types in translations
    const keysWithInterpolation = [
      {
        key: "update.newVersion",
        params: { version: "1.2.3" },
        shouldContain: "1.2.3",
      },
      {
        key: "update.releaseDate",
        params: { date: "2024-01-01" },
        shouldContain: "2024-01-01",
      },
      {
        key: "update.downloadProgress",
        params: { progress: 50 },
        shouldContain: "50",
      },
    ];

    // Property: Nested keys with interpolation should work correctly
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...keysWithInterpolation),
        async ({ key, params, shouldContain }) => {
          const result = i18n.t(key as any, params as any);

          // Should contain the interpolated value
          expect(result as string).toContain(shouldContain);
          // Should not return the key itself
          expect(result).not.toBe(key);
        },
      ),
      { numRuns: 100 },
    );
  });
});
