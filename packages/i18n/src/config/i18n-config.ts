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
import onboardingEn from "../locales/en/onboarding.json";
import inventoryEn from "../locales/en/inventory.json";
import loginEn from "../locales/en/login.json";
import manufacturerEn from "../locales/en/manufacturer.json";
import medicineFormsEn from "../locales/en/medicine-forms.json";
import stockAdjustmentsEn from "../locales/en/stock-adjustments.json";
import itemInquiryEn from "../locales/en/item-inquiry.json";
import openingBalancesEn from "../locales/en/opening-balances.json";

import commonAr from "../locales/ar/common.json";
import homeAr from "../locales/ar/home.json";
import ordersAr from "../locales/ar/orders.json";
import suppliersAr from "../locales/ar/suppliers.json";
import reportsAr from "../locales/ar/reports.json";
import settingsAr from "../locales/ar/settings.json";
import validationAr from "../locales/ar/validation.json";
import onboardingAr from "../locales/ar/onboarding.json";
import inventoryAr from "../locales/ar/inventory.json";
import loginAr from "../locales/ar/login.json";
import manufacturerAr from "../locales/ar/manufacturer.json";
import medicineFormsAr from "../locales/ar/medicine-forms.json";
import stockAdjustmentsAr from "../locales/ar/stock-adjustments.json";
import itemInquiryAr from "../locales/ar/item-inquiry.json";
import openingBalancesAr from "../locales/ar/opening-balances.json";

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

export async function initializeI18n(initialLocale?: Locale) {
  const locale = initialLocale || DEFAULT_LOCALE;
  console.log("🌍 Initializing i18n with locale:", locale);

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
          onboarding: onboardingEn,
          inventory: inventoryEn,
          login: loginEn,
          manufacturer: manufacturerEn,
          "medicine-forms": medicineFormsEn,
          "stock-adjustments": stockAdjustmentsEn,
          "item-inquiry": itemInquiryEn,
          "opening-balances": openingBalancesEn,
        },
        ar: {
          common: commonAr,
          home: homeAr,
          orders: ordersAr,
          suppliers: suppliersAr,
          reports: reportsAr,
          settings: settingsAr,
          validation: validationAr,
          onboarding: onboardingAr,
          inventory: inventoryAr,
          login: loginAr,
          manufacturer: manufacturerAr,
          "medicine-forms": medicineFormsAr,
          "stock-adjustments": stockAdjustmentsAr,
          "item-inquiry": itemInquiryAr,
          "opening-balances": openingBalancesAr,
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

    console.log(
      "✅ i18n initialized successfully with language:",
      i18n.language,
    );

    return i18n;
  } catch (error) {
    console.error("❌ Failed to initialize i18n:", error);
    // Continue with minimal configuration
    console.warn("⚠️ Continuing with fallback configuration");

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
        "❌ Failed to initialize i18n with fallback config:",
        fallbackError,
      );
    }

    return i18n;
  }
}
export { i18n };
