import { ThemeProvider, useTheme } from "@/components/settings";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider, useDirection, useLocale } from "@meditrack/i18n";
import { QueryProvider } from "./query-provider";
import { ZodProvider } from "./zod-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { useEffect } from "react";
import type { Locale } from "@meditrack/i18n";
import { useNotifications, useAutoArchive, useSettingValue } from "@/hooks";
import {
  SETTING_DEFAULT_LANGUAGE,
  SETTING_DEFAULT_THEME,
} from "@/lib/constants";
import { useCheckFirstRun } from "@/hooks/use-onboarding-db";

interface AppProvidersProps {
  children: React.ReactNode;
}

function AppContent({ children }: { children: React.ReactNode }) {
  const direction = useDirection();
  const { setLocale } = useLocale();
  const { setTheme } = useTheme();

  // Check if this is first run (onboarding not completed)
  const { data: isFirstRun, isLoading: isCheckingFirstRun } =
    useCheckFirstRun();

  // Load settings from PostgreSQL
  const defaultLanguage = useSettingValue<Locale>(
    SETTING_DEFAULT_LANGUAGE,
    "en",
  );
  const defaultTheme = useSettingValue<"light" | "dark" | "system">(
    SETTING_DEFAULT_THEME,
    "system",
  );

  // Initialize notification system
  useNotifications();

  // Initialize auto-archive system
  useAutoArchive();

  // Sync language from database (skip during first run/onboarding)
  useEffect(() => {
    if (
      !isCheckingFirstRun &&
      !isFirstRun &&
      defaultLanguage &&
      (defaultLanguage === "en" || defaultLanguage === "ar")
    ) {
      console.log("✅ Syncing language from database:", defaultLanguage);
      setLocale(defaultLanguage);
    }
  }, [defaultLanguage, setLocale, isFirstRun, isCheckingFirstRun]);

  // Sync theme from database (skip during first run/onboarding)
  useEffect(() => {
    if (
      !isCheckingFirstRun &&
      !isFirstRun &&
      defaultTheme &&
      (defaultTheme === "light" ||
        defaultTheme === "dark" ||
        defaultTheme === "system")
    ) {
      console.log("✅ Syncing theme from database:", defaultTheme);
      setTheme(defaultTheme);
    }
  }, [defaultTheme, setTheme, isFirstRun, isCheckingFirstRun]);

  return (
    <>
      {children}
      <Toaster
        richColors
        position="top-center"
        dir={direction.isRTL ? "rtl" : "ltr"}
      />
    </>
  );
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <I18nProvider initialLocale="en">
      <ZodProvider>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            disableTransitionOnChange
          >
            <AuthProvider>
              <AppContent>{children}</AppContent>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </ZodProvider>
    </I18nProvider>
  );
}
