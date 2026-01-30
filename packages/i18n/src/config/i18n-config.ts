import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import type { Locale } from "../types";
import { DEFAULT_LOCALE, FALLBACK_LOCALE } from "./locales";

// Import translation files
import commonEn from "../locales/en/common.json";
import homeEn from "../locales/en/home.json";
import ordersEn from "../locales/en/orders.json";
import suppliersEn from "../locales/en/suppliers.json";
import reportsEn from "../locales/en/reports.json";
import settingsEn from "../locales/en/settings.json";
import validationEn from "../locales/en/validation.json";

import commonAr from "../locales/ar/common.json";
import homeAr from "../locales/ar/home.json";
import ordersAr from "../locales/ar/orders.json";
import suppliersAr from "../locales/ar/suppliers.json";
import reportsAr from "../locales/ar/reports.json";
import settingsAr from "../locales/ar/settings.json";
import validationAr from "../locales/ar/validation.json";

const STORAGE_KEY = "medi-order-locale";

// Missing translations registry for development
export const missingTranslations = new Set<string>();

// Helper to check if we're in development mode
// This will be false by default, can be overridden by build tools
const isDevelopment = false;

// Helper to get missing translations as array
export function getMissingTranslations(): string[] {
  return Array.from(missingTranslations);
}

// Helper to clear missing translations registry
export function clearMissingTranslations(): void {
  missingTranslations.clear();
}

export function getStoredLocale(): Locale | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "ar") {
      return stored;
    }
  } catch (error) {
    console.warn("Failed to read locale from localStorage:", error);
  }
  return null;
}

export function setStoredLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch (error) {
    console.warn("Failed to save locale to localStorage:", error);
  }
}

export function detectLocale(): Locale {
  // 1. Check localStorage
  const stored = getStoredLocale();
  if (stored) return stored;

  // 2. Check browser language
  if (typeof navigator !== "undefined") {
    const browserLang = navigator.language.split("-")[0];
    if (browserLang === "ar") return "ar";
  }

  // 3. Default to English
  return DEFAULT_LOCALE;
}

export async function initializeI18n(initialLocale?: Locale) {
  const locale = initialLocale || detectLocale();

  try {
    await i18n.use(initReactI18next).init({
      resources: {
        en: {
          common: commonEn,
          home: homeEn,
          orders: ordersEn,
          suppliers: suppliersEn,
          reports: reportsEn,
          settings: settingsEn,
          validation: validationEn,
        },
        ar: {
          common: commonAr,
          home: homeAr,
          orders: ordersAr,
          suppliers: suppliersAr,
          reports: reportsAr,
          settings: settingsAr,
          validation: validationAr,
        },
      },
      lng: locale,
      fallbackLng: FALLBACK_LOCALE,
      defaultNS: "common",
      fallbackNS: "common",

      debug: isDevelopment,

      interpolation: {
        escapeValue: false, // React already escapes
      },

      react: {
        useSuspense: false, // Use loading states instead
      },

      returnNull: false,
      returnEmptyString: false,

      saveMissing: isDevelopment,
      missingKeyHandler: (lngs, ns, key) => {
        if (isDevelopment) {
          const missingKey = `${ns}:${key}`;
          missingTranslations.add(missingKey);
          console.warn(
            `🔴 Missing translation: ${missingKey} for languages: ${lngs.join(", ")}`,
          );
        }
      },

      // Format missing keys with visual indicator in development
      parseMissingKeyHandler: (key) => {
        if (isDevelopment) {
          return `⚠️ ${key} ⚠️`;
        }
        return key;
      },
    });

    // Store the selected locale
    setStoredLocale(locale);

    return i18n;
  } catch (error) {
    console.error("Failed to initialize i18n:", error);
    // Continue with minimal configuration
    console.warn("Continuing with fallback configuration");

    // Try to initialize with minimal config
    try {
      await i18n.use(initReactI18next).init({
        lng: FALLBACK_LOCALE,
        fallbackLng: FALLBACK_LOCALE,
        defaultNS: "common",
        resources: {
          en: {
            common: commonEn,
          },
        },
        interpolation: {
          escapeValue: false,
        },
        react: {
          useSuspense: false,
        },
      });
    } catch (fallbackError) {
      console.error(
        "Failed to initialize i18n with fallback config:",
        fallbackError,
      );
    }

    return i18n;
  }
}
export { i18n };
