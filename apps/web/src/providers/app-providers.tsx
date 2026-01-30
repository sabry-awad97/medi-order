import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider, useDirection } from "@meditrack/i18n";
import { QueryProvider } from "./query-provider";
import { ZodProvider } from "./zod-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import type { Locale } from "@meditrack/i18n";
import { useNotifications, useAutoArchive } from "@/hooks";

interface AppProvidersProps {
  children: React.ReactNode;
}

// Helper to get stored language from IndexedDB
async function getStoredLanguage(): Promise<Locale> {
  console.log("🔍 Getting stored language...");
  try {
    const { default: localforage } = await import("localforage");
    const settingsDB = localforage.createInstance({
      name: "pharmacy-special-orders",
      storeName: "settings",
    });

    const language = await settingsDB.getItem<string>("defaultLanguage");
    console.log("📦 IndexedDB language:", language);
    if (language === "en" || language === "ar") {
      console.log("✅ Using language from IndexedDB:", language);
      return language;
    }
  } catch (error) {
    console.warn("⚠️ Failed to read language from settings:", error);
  }

  // Fallback to localStorage (i18n's own storage)
  try {
    const stored = localStorage.getItem("meditrack-locale");
    console.log("📦 localStorage language:", stored);
    if (stored === "en" || stored === "ar") {
      console.log("✅ Using language from localStorage:", stored);
      return stored;
    }
  } catch (error) {
    console.warn("⚠️ Failed to read language from localStorage:", error);
  }

  console.log("✅ Using default language: en");
  return "en"; // Default to English
}

// Helper to get stored theme from IndexedDB
async function getStoredTheme(): Promise<"light" | "dark" | "system"> {
  try {
    const { default: localforage } = await import("localforage");
    const settingsDB = localforage.createInstance({
      name: "pharmacy-special-orders",
      storeName: "settings",
    });

    const theme = await settingsDB.getItem<string>("defaultTheme");
    if (theme === "light" || theme === "dark" || theme === "system") {
      return theme;
    }
  } catch (error) {
    console.warn("⚠️ Failed to read theme from settings:", error);
  }

  // Fallback to localStorage (ThemeProvider's own storage)
  try {
    const stored = localStorage.getItem("pharmacy-theme");
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored as "light" | "dark" | "system";
    }
  } catch (error) {
    console.warn("⚠️ Failed to read theme from localStorage:", error);
  }

  return "system"; // Default to system
}

function AppContent({ children }: { children: React.ReactNode }) {
  const direction = useDirection();
  const [defaultTheme, setDefaultTheme] = useState<"light" | "dark" | "system">(
    "system",
  );

  // Initialize notification system
  useNotifications();

  // Initialize auto-archive system
  useAutoArchive();

  useEffect(() => {
    getStoredTheme().then(setDefaultTheme);
  }, []);

  return (
    <ZodProvider>
      <QueryProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme={defaultTheme}
          disableTransitionOnChange
          storageKey="pharmacy-theme"
        >
          <AuthProvider>
            {children}
            <Toaster
              richColors
              position="top-center"
              dir={direction.isRTL ? "rtl" : "ltr"}
            />
          </AuthProvider>
        </ThemeProvider>
      </QueryProvider>
    </ZodProvider>
  );
}

export function AppProviders({ children }: AppProvidersProps) {
  const [initialLocale, setInitialLocale] = useState<Locale | undefined>();

  useEffect(() => {
    console.log("🚀 AppProviders mounting, loading initial locale...");
    getStoredLanguage().then((locale) => {
      console.log("✅ Initial locale loaded:", locale);
      setInitialLocale(locale);
    });
  }, []);

  // Wait for initial locale to be loaded
  if (initialLocale === undefined) {
    console.log("⏳ Waiting for initial locale...");
    return null; // Or a loading spinner
  }

  console.log("🎨 Rendering AppProviders with locale:", initialLocale);

  return (
    <I18nProvider initialLocale={initialLocale}>
      <AppContent>{children}</AppContent>
    </I18nProvider>
  );
}
