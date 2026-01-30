import { describe, it, expect, beforeAll } from "vitest";
import * as fc from "fast-check";
import { z } from "zod/v3";
import { initializeI18n } from "../config/i18n-config";
import {
  createZodErrorMap,
  localizedZodSchema,
} from "../utils/zod-integration";

/**
 * Property Tests for Zod Integration
 *
 * Validates Requirements:
 * - 7.2: Localized validation errors
 * - 7.3: Validation error interpolation
 * - 7.5: Language switching with active validation errors
 *
 * These tests ensure that:
 * 1. Validation errors are properly localized
 * 2. Error messages include interpolated values (min, max, etc.)
 * 3. Switching languages updates validation error messages
 * 4. Missing translations fall back gracefully
 */

describe("Property Test: Zod Integration", () => {
  beforeAll(async () => {
    await initializeI18n("en");
  });

  it("Property 8: Localized validation errors", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;

    // Property: All validation errors should be localized
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("en", "ar"),
        fc.string({ minLength: 1, maxLength: 5 }), // Too short for min(8)
        async (locale, shortString) => {
          await i18n.changeLanguage(locale);
          const t = i18n.t.bind(i18n);

          const schema = localizedZodSchema(
            z.object({
              password: z.string().min(8),
            }),
            t,
          );

          const result = schema.safeParse({ password: shortString });

          // Should fail validation
          expect(result.success).toBe(false);

          if (!result.success) {
            const error = result.error.errors[0];

            // Error message should not be the default English message
            // when in Arabic locale
            if (locale === "ar") {
              expect(error?.message).not.toContain("Must be at least");
            }

            // Should contain the minimum value
            expect(error?.message).toContain("8");
          }
        },
      ),
      { numRuns: 50 },
    );
  });

  it("Property 9: Validation error interpolation", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;
    await i18n.changeLanguage("en");
    const t = i18n.t.bind(i18n);

    // Property: Error messages should include interpolated constraint values
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 5, max: 20 }),
        fc.string({ minLength: 1, maxLength: 3 }),
        async (minLength, shortString) => {
          const schema = localizedZodSchema(
            z.object({
              field: z.string().min(minLength),
            }),
            t,
          );

          const result = schema.safeParse({ field: shortString });

          if (!result.success) {
            const error = result.error.errors[0];

            // Error message should contain the minimum length value
            expect(error?.message).toContain(String(minLength));
          }
        },
      ),
      { numRuns: 50 },
    );
  });

  it("should handle email validation errors", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;

    // Property: Email validation should work in both languages
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("en", "ar"),
        fc
          .string({ minLength: 1, maxLength: 20 })
          .filter((s) => !s.includes("@")),
        async (locale, invalidEmail) => {
          await i18n.changeLanguage(locale);
          const t = i18n.t.bind(i18n);

          const schema = localizedZodSchema(
            z.object({
              email: z.string().email(),
            }),
            t,
          );

          const result = schema.safeParse({ email: invalidEmail });

          // Should fail validation
          expect(result.success).toBe(false);

          if (!result.success) {
            const error = result.error.errors[0];

            // Should have an error message
            expect(error?.message.length).toBeGreaterThan(0);

            // Should not be the key itself
            expect(error?.message).not.toContain("validation:");
          }
        },
      ),
      { numRuns: 30 },
    );
  });

  it("should handle required field errors", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;

    // Property: Required field errors should be localized
    await fc.assert(
      fc.asyncProperty(fc.constantFrom("en", "ar"), async (locale) => {
        await i18n.changeLanguage(locale);
        const t = i18n.t.bind(i18n);

        const schema = localizedZodSchema(
          z.object({
            name: z.string(),
          }),
          t,
        );

        const result = schema.safeParse({ name: undefined });

        // Should fail validation
        expect(result.success).toBe(false);

        if (!result.success) {
          const error = result.error.errors[0];

          // Should have an error message
          expect(error?.message.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 30 },
    );
  });

  it("should handle max length validation", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;
    await i18n.changeLanguage("en");
    const t = i18n.t.bind(i18n);

    // Property: Max length errors should include the maximum value
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 5, max: 15 }),
        fc.string({ minLength: 20, maxLength: 50 }),
        async (maxLength, longString) => {
          const schema = localizedZodSchema(
            z.object({
              field: z.string().max(maxLength),
            }),
            t,
          );

          const result = schema.safeParse({ field: longString });

          if (!result.success) {
            const error = result.error.errors[0];

            // Error message should contain the maximum length value
            expect(error?.message).toContain(String(maxLength));
          }
        },
      ),
      { numRuns: 30 },
    );
  });

  it("should handle numeric validation", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;
    await i18n.changeLanguage("en");
    const t = i18n.t.bind(i18n);

    // Property: Numeric min/max validation should work
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10, max: 100 }),
        fc.integer({ min: 0, max: 5 }),
        async (minValue, smallValue) => {
          const schema = localizedZodSchema(
            z.object({
              count: z.number().min(minValue),
            }),
            t,
          );

          const result = schema.safeParse({ count: smallValue });

          if (!result.success) {
            const error = result.error.errors[0];

            // Error message should contain the minimum value
            expect(error?.message).toContain(String(minValue));
          }
        },
      ),
      { numRuns: 30 },
    );
  });

  it("Property 10: Active form error updates on language change", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;

    // Property: Changing language should allow re-validation with new messages
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 5 }),
        async (shortString) => {
          // Start in English
          await i18n.changeLanguage("en");
          let t = i18n.t.bind(i18n);

          const schema = localizedZodSchema(
            z.object({
              password: z.string().min(8),
            }),
            t,
          );

          const resultEn = schema.safeParse({ password: shortString });
          expect(resultEn.success).toBe(false);

          // Switch to Arabic and re-validate
          await i18n.changeLanguage("ar");
          t = i18n.t.bind(i18n);

          const schemaAr = localizedZodSchema(
            z.object({
              password: z.string().min(8),
            }),
            t,
          );

          const resultAr = schemaAr.safeParse({ password: shortString });
          expect(resultAr.success).toBe(false);

          // Both should have errors, but messages should be different
          if (!resultEn.success && !resultAr.success) {
            const errorEn = resultEn.error.errors[0]?.message;
            const errorAr = resultAr.error.errors[0]?.message;

            // Messages should be different (different languages)
            expect(errorEn).not.toBe(errorAr);
          }
        },
      ),
      { numRuns: 30 },
    );
  });

  it("should handle enum validation", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;
    await i18n.changeLanguage("en");
    const t = i18n.t.bind(i18n);

    // Property: Enum validation should work with localized errors
    await fc.assert(
      fc.asyncProperty(
        fc
          .string({ minLength: 1, maxLength: 10 })
          .filter((s) => !["pending", "delivered", "cancelled"].includes(s)),
        async (invalidValue) => {
          const schema = localizedZodSchema(
            z.object({
              status: z.enum(["pending", "delivered", "cancelled"]),
            }),
            t,
          );

          const result = schema.safeParse({ status: invalidValue });

          // Should fail validation
          expect(result.success).toBe(false);

          if (!result.success) {
            const error = result.error.errors[0];

            // Should have an error message
            expect(error?.message.length).toBeGreaterThan(0);
          }
        },
      ),
      { numRuns: 20 },
    );
  });

  it("should handle nested object validation", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;
    await i18n.changeLanguage("en");
    const t = i18n.t.bind(i18n);

    // Property: Nested validation should work
    const schema = localizedZodSchema(
      z.object({
        user: z.object({
          name: z.string().min(3),
          email: z.string().email(),
        }),
      }),
      t,
    );

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 2 }),
        async (shortName) => {
          const result = schema.safeParse({
            user: {
              name: shortName,
              email: "invalid",
            },
          });

          // Should fail validation
          expect(result.success).toBe(false);

          if (!result.success) {
            // Should have at least one error
            expect(result.error.errors.length).toBeGreaterThan(0);
          }
        },
      ),
      { numRuns: 20 },
    );
  });

  it("should handle fallback when translation is missing", async () => {
    const i18n = (await import("../config/i18n-config")).i18n;
    await i18n.changeLanguage("en");
    const t = i18n.t.bind(i18n);

    // Create error map
    const errorMap = createZodErrorMap(t);

    // Test with an unsupported error code
    const result = errorMap(
      { code: "custom" as any, message: "Custom error", path: [] },
      { defaultError: "Default error message", data: undefined },
    );

    // Should return a message (either translated or default)
    expect(result.message.length).toBeGreaterThan(0);
  });
});
