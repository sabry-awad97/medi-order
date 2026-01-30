// Core exports
export { I18nProvider } from "./provider";
export type { I18nProviderProps } from "./provider";

// Hooks
export { useTranslation } from "./hooks/useTranslation";
export { useLocale } from "./hooks/useLocale";
export { useDirection } from "./hooks/useDirection";

// Components
export { Trans } from "./components/Trans";

// Utilities
export { createZodErrorMap, localizedZodSchema } from "./utils/zod-integration";
export { getLocaleFromPath, localizedPath } from "./utils/router-integration";
export { formatDate, formatNumber, formatCurrency } from "./utils/format";

// Types
export type { Locale, LocaleConfig, TextDirection } from "./types";
export type { UseLocaleReturn } from "./hooks/useLocale";
export type { UseDirectionReturn } from "./hooks/useDirection";

// Configuration
export { LOCALES, DEFAULT_LOCALE, FALLBACK_LOCALE } from "./config/locales";
export {
  getMissingTranslations,
  clearMissingTranslations,
} from "./config/i18n-config";
