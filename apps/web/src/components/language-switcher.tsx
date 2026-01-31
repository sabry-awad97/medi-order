import { useLocale, LOCALES } from "@meditrack/i18n";
import type { Locale } from "@meditrack/i18n";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUpsertSettingValue } from "@/hooks";

export function LanguageSwitcher() {
  const { locale, setLocale, availableLocales } = useLocale();
  const upsertSettingValue = useUpsertSettingValue();

  const handleLanguageChange = async (newLocale: Locale) => {
    console.log("🌍 Language change requested:", {
      from: locale,
      to: newLocale,
    });
    try {
      console.log("🔄 Calling setLocale...");
      await setLocale(newLocale);
      console.log("✅ setLocale completed");

      // Also save to settings database for persistence
      console.log("💾 Saving to settings database...");
      upsertSettingValue.mutate({
        key: "defaultLanguage",
        value: newLocale,
        category: "appearance",
      });
      console.log("✅ Settings database updated");
    } catch (error) {
      console.error("❌ Failed to change language:", error);
    }
  };

  console.log("🔍 LanguageSwitcher render:", { locale, availableLocales });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
        <Languages className="h-4 w-4" />
        <span className="sr-only">Select language</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableLocales.map((loc) => {
          const config = LOCALES[loc];
          const isActive = locale === loc;

          return (
            <DropdownMenuItem
              key={loc}
              onClick={() => handleLanguageChange(loc)}
              className="gap-2 cursor-pointer"
            >
              <span className="text-base">{config.flag}</span>
              <span className="flex-1">{config.nativeName}</span>
              {isActive && (
                <span className="text-xs text-muted-foreground">✓</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
