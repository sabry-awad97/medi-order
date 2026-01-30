import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { renderHook, waitFor } from "@testing-library/react";
import { useTranslation } from "../hooks/useTranslation";
import { useLocale } from "../hooks/useLocale";
import { useDirection } from "../hooks/useDirection";
import { I18nProvider } from "../provider";
import type { ReactNode } from "react";

/**
 * Property Test 6: Automatic Namespace Loading
 * Property Test 7: Component Re-render on Language Change
 *
 * Validates Requirements 5.3, 6.4:
 * - Automatic namespace loading
 * - Component re-rendering on language changes
 *
 * These tests ensure that:
 * 1. Hooks automatically load the correct namespace
 * 2. Components re-render when language changes
 * 3. Translations update immediately after language switch
 * 4. Multiple hooks can coexist without conflicts
 */

// Wrapper component for testing hooks with I18nProvider
function createWrapper(initialLocale: "en" | "ar" = "en") {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <I18nProvider initialLocale={initialLocale}>{children}</I18nProvider>
    );
  };
}

describe("Property Test: React Hooks", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("Property 6: Automatic namespace loading", async () => {
    // Property: For any valid namespace, useTranslation should automatically load it
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("common", "orders", "suppliers", "settings"),
        async (namespace) => {
          const { result } = renderHook(
            () => useTranslation(namespace as any),
            { wrapper: createWrapper("en") },
          );

          // Wait for i18n to initialize
          await waitFor(() => {
            expect(result.current.i18n.isInitialized).toBe(true);
          });

          // Should be able to get translations from the namespace
          const translation = result.current.t("title");

          // Should return a valid translation (not the key itself for most namespaces)
          expect(typeof translation).toBe("string");
          expect(translation.length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 50 },
    );
  });

  it("Property 7: Component re-render on language change", async () => {
    // Property: Changing language should trigger re-render with new translations
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("en", "ar"),
        fc.constantFrom("en", "ar"),
        async (initialLocale, targetLocale) => {
          const { result } = renderHook(
            () => {
              const { t } = useTranslation("common");
              const { locale, setLocale } = useLocale();
              return { t, locale, setLocale };
            },
            { wrapper: createWrapper(initialLocale) },
          );

          // Wait for initialization
          await waitFor(() => {
            expect(result.current.locale).toBe(initialLocale);
          });

          // Get initial translation
          const initialTranslation = result.current.t("app.name");
          expect(initialTranslation).toBeTruthy();

          // Change language
          await result.current.setLocale(targetLocale);

          // Wait for language change to complete
          await waitFor(() => {
            expect(result.current.locale).toBe(targetLocale);
          });

          // Get new translation
          const newTranslation = result.current.t("app.name");
          expect(newTranslation).toBeTruthy();

          // If locales are different, translations should be different
          if (initialLocale !== targetLocale) {
            expect(newTranslation).not.toBe(initialTranslation);
          } else {
            expect(newTranslation).toBe(initialTranslation);
          }
        },
      ),
      { numRuns: 50 },
    );
  });

  it("should handle multiple namespace switches", async () => {
    // Property: Switching between namespaces should work correctly
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.constantFrom("common", "orders", "suppliers", "settings"), {
          minLength: 2,
          maxLength: 5,
        }),
        async (namespaces) => {
          const { result, rerender } = renderHook(
            ({ ns }: { ns: string }) => useTranslation(ns as any),
            {
              wrapper: createWrapper("en"),
              initialProps: { ns: namespaces[0] as any },
            },
          );

          // Wait for initialization
          await waitFor(() => {
            expect(result.current.i18n.isInitialized).toBe(true);
          });

          // Switch through all namespaces
          for (const namespace of namespaces) {
            rerender({ ns: namespace });

            await waitFor(() => {
              // Should be able to get translations
              const translation = result.current.t("title");
              expect(typeof translation).toBe("string");
            });
          }
        },
      ),
      { numRuns: 30 },
    );
  });

  it("should update direction when locale changes", async () => {
    // Property: Direction should update automatically when locale changes
    await fc.assert(
      fc.asyncProperty(fc.constantFrom("en", "ar"), async (targetLocale) => {
        const { result } = renderHook(
          () => {
            const { setLocale } = useLocale();
            const direction = useDirection();
            return { setLocale, ...direction };
          },
          { wrapper: createWrapper("en") },
        );

        // Wait for initialization
        await waitFor(() => {
          expect(result.current.direction).toBe("ltr");
        });

        // Change locale
        await result.current.setLocale(targetLocale);

        // Wait for direction to update
        await waitFor(() => {
          const expectedDirection = targetLocale === "ar" ? "rtl" : "ltr";
          expect(result.current.direction).toBe(expectedDirection);
          expect(result.current.isRTL).toBe(targetLocale === "ar");
          expect(result.current.isLTR).toBe(targetLocale === "en");
        });
      }),
      { numRuns: 50 },
    );
  });

  it("should handle rapid language switches", async () => {
    // Property: Rapid language switches should end in consistent state
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.constantFrom("en", "ar"), { minLength: 3, maxLength: 10 }),
        async (localeSequence) => {
          const { result } = renderHook(
            () => {
              const { locale, setLocale } = useLocale();
              const { t } = useTranslation("common");
              return { locale, setLocale, t };
            },
            { wrapper: createWrapper("en") },
          );

          // Wait for initialization
          await waitFor(() => {
            expect(result.current.locale).toBe("en");
          });

          // Apply all locale switches
          for (const locale of localeSequence) {
            await result.current.setLocale(locale);
          }

          // Wait for final state
          const finalLocale = localeSequence[localeSequence.length - 1];
          await waitFor(() => {
            expect(result.current.locale).toBe(finalLocale);
          });

          // Translation should be valid for final locale
          const translation = result.current.t("app.name");
          expect(translation).toBeTruthy();
          expect(translation).not.toBe("app.name");
        },
      ),
      { numRuns: 30 },
    );
  });

  it("should maintain translation consistency across re-renders", async () => {
    // Property: Same key should return same translation across re-renders
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("en", "ar"),
        fc.constantFrom("app.name", "navigation.home", "actions.save"),
        async (locale, key) => {
          const { result, rerender } = renderHook(
            () => useTranslation("common"),
            { wrapper: createWrapper(locale) },
          );

          // Wait for initialization
          await waitFor(() => {
            expect(result.current.i18n.isInitialized).toBe(true);
          });

          const translation1 = result.current.t(key);

          // Force re-render
          rerender();

          const translation2 = result.current.t(key);

          // Should return the same translation
          expect(translation1).toBe(translation2);
        },
      ),
      { numRuns: 50 },
    );
  });

  it("should handle invalid locale gracefully", async () => {
    // Property: Setting invalid locale should throw error
    const { result } = renderHook(() => useLocale(), {
      wrapper: createWrapper("en"),
    });

    // Wait for initialization
    await waitFor(() => {
      expect(result.current.locale).toBe("en");
    });

    // Try to set invalid locale
    await expect(result.current.setLocale("invalid" as any)).rejects.toThrow(
      "Invalid locale",
    );

    // Locale should remain unchanged
    expect(result.current.locale).toBe("en");
  });

  it("should provide correct available locales", async () => {
    // Property: availableLocales should always contain valid locales
    const { result } = renderHook(() => useLocale(), {
      wrapper: createWrapper("en"),
    });

    // Wait for initialization
    await waitFor(() => {
      expect(result.current.locale).toBe("en");
    });

    const { availableLocales } = result.current;

    // Should contain both en and ar
    expect(availableLocales).toContain("en");
    expect(availableLocales).toContain("ar");
    expect(availableLocales.length).toBe(2);
  });

  it("should handle concurrent hook usage", async () => {
    // Property: Multiple hooks can be used simultaneously without conflicts
    await fc.assert(
      fc.asyncProperty(fc.constantFrom("en", "ar"), async (locale) => {
        const { result } = renderHook(
          () => {
            const translation = useTranslation("common");
            const localeHook = useLocale();
            const direction = useDirection();
            return { translation, localeHook, direction };
          },
          { wrapper: createWrapper(locale) },
        );

        // Wait for initialization
        await waitFor(() => {
          expect(result.current.localeHook.locale).toBe(locale);
        });

        // All hooks should work correctly
        expect(result.current.translation.t("app.name")).toBeTruthy();
        expect(result.current.localeHook.locale).toBe(locale);
        expect(result.current.direction.direction).toBe(
          locale === "ar" ? "rtl" : "ltr",
        );
      }),
      { numRuns: 50 },
    );
  });

  it("should handle missing translations gracefully", async () => {
    // Property: Missing translations should return the key or a fallback
    await fc.assert(
      fc.asyncProperty(
        fc
          .string({ minLength: 5, maxLength: 20 })
          .filter((s) => /^[a-z.]+$/.test(s)),
        async (invalidKey) => {
          const { result } = renderHook(() => useTranslation("common"), {
            wrapper: createWrapper("en"),
          });

          // Wait for initialization
          await waitFor(() => {
            expect(result.current.i18n.isInitialized).toBe(true);
          });

          const translation = result.current.t(invalidKey as any);

          // Should return a string (key itself or with warning indicators)
          expect(typeof translation).toBe("string");
          expect(translation.length).toBeGreaterThan(0);

          // Should contain the key
          expect(translation).toContain(invalidKey);
        },
      ),
      { numRuns: 30 },
    );
  });
});
