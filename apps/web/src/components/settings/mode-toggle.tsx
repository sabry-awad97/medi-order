import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/settings";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUpsertSettingValue } from "@/hooks";
import { getSettingDefinition, SETTING_DEFAULT_THEME } from "@/lib/constants";

export function ModeToggle() {
  const { setTheme } = useTheme();
  const upsertSettingValue = useUpsertSettingValue();

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    setTheme(theme);
    // Also save to settings database for persistence
    const def = getSettingDefinition(SETTING_DEFAULT_THEME);
    upsertSettingValue.mutate({
      key: SETTING_DEFAULT_THEME,
      value: theme,
      category: def?.category,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
        <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
