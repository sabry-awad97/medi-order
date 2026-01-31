import { useLocale, useTranslation } from "@meditrack/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Bell,
  Check,
  Cog,
  MessageSquare,
  Package,
  Palette,
  Search,
  Settings as SettingsIcon,
  Users,
  X,
  Database,
  Trash2,
} from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";

import { ManualUpdateCheck } from "@/components/manual-update-check";
import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loading } from "@/components/ui/loading";
import {
  Page,
  PageContent,
  PageContentInner,
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
  PageHeaderTrigger,
} from "@/components/ui/page";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useSettings, useSettingValue, useUpsertSettingValue } from "@/hooks";
import {
  SETTINGS_CATEGORIES,
  SETTINGS_DEFINITIONS,
  type SettingCategory,
  type SettingDefinition,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useState as useNotificationState } from "react";
import {
  SETTING_DEFAULT_LANGUAGE,
  SETTING_DEFAULT_THEME,
} from "@/lib/constants";
import { useSeedData, useClearData } from "@/hooks/use-seed-data";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

// Notification Permission Button Component
function NotificationPermissionButton() {
  const { t } = useTranslation("settings");
  const [permission, setPermission] =
    useNotificationState<NotificationPermission>("default");

  React.useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
  };

  if (!("Notification" in window)) {
    return null;
  }

  if (permission === "granted") {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Check className="h-3 w-3 text-green-600" />
        <span>Notifications enabled</span>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={requestPermission}
      className="w-full text-xs"
    >
      <Bell className="h-3 w-3" />
      <span>Enable Browser Notifications</span>
    </Button>
  );
}

// CVA variants for setting rows
const settingRowVariants = cva(
  "flex items-center justify-between gap-3 py-2.5 px-3 rounded-md transition-colors",
  {
    variants: {
      variant: {
        default: "hover:bg-muted/50",
        focused: "bg-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// Category icons
const categoryIcons: Record<SettingCategory, any> = {
  general: SettingsIcon,
  orders: Package,
  suppliers: Users,
  alerts: Bell,
  notifications: MessageSquare,
  appearance: Palette,
  system: Cog,
};

function SettingsPage() {
  const { t } = useTranslation("settings");
  const { locale, setLocale } = useLocale();
  const { theme, setTheme } = useTheme();
  const { isLoading } = useSettings();
  const upsertSettingValue = useUpsertSettingValue();
  const seedData = useSeedData();
  const clearData = useClearData();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");

  // Sync language setting with i18n ONLY on initial load
  const defaultLanguage = useSettingValue<string>(
    SETTING_DEFAULT_LANGUAGE,
    "en",
  );
  const hasInitializedLanguage = React.useRef(false);
  useEffect(() => {
    if (defaultLanguage && !hasInitializedLanguage.current) {
      if (defaultLanguage !== locale) {
        console.log(
          "🔄 Settings page: Syncing language from DB:",
          defaultLanguage,
        );
        setLocale(defaultLanguage as "en" | "ar");
      }
      hasInitializedLanguage.current = true;
    }
  }, [defaultLanguage, locale, setLocale]);

  // Sync theme setting with ThemeProvider ONLY on initial load
  const defaultTheme = useSettingValue<string>(SETTING_DEFAULT_THEME, "system");
  const hasInitializedTheme = React.useRef(false);
  useEffect(() => {
    if (defaultTheme && !hasInitializedTheme.current) {
      if (
        defaultTheme !== theme &&
        (defaultTheme === "light" ||
          defaultTheme === "dark" ||
          defaultTheme === "system")
      ) {
        console.log("🔄 Settings page: Syncing theme from DB:", defaultTheme);
        setTheme(defaultTheme as "light" | "dark" | "system");
      }
      hasInitializedTheme.current = true;
    }
  }, [defaultTheme, theme, setTheme]);

  const handleChange = (key: string, value: unknown, category?: string) => {
    // Update setting immediately (upsert: create if not exists, update if exists)
    upsertSettingValue.mutate({ key, value, category });

    // If language is changed, update i18n immediately for better UX
    if (
      key === SETTING_DEFAULT_LANGUAGE &&
      (value === "en" || value === "ar")
    ) {
      setLocale(value);
    }

    // If theme is changed, update theme immediately for better UX
    if (
      key === SETTING_DEFAULT_THEME &&
      (value === "light" || value === "dark" || value === "system")
    ) {
      setTheme(value as "light" | "dark" | "system");
    }
  };
  // Filter settings based on search
  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return Object.keys(SETTINGS_CATEGORIES) as SettingCategory[];
    }

    const query = searchQuery.toLowerCase();
    return (Object.keys(SETTINGS_CATEGORIES) as SettingCategory[]).filter(
      (category) => {
        const categoryLabel = t(
          SETTINGS_CATEGORIES[category].label,
        ).toLowerCase();
        const categoryDesc = t(
          SETTINGS_CATEGORIES[category].description,
        ).toLowerCase();
        const hasMatchingSettings = SETTINGS_DEFINITIONS.filter(
          (s) => s.category === category,
        ).some((setting) => {
          const label = t(setting.label).toLowerCase();
          const desc = setting.description[locale].toLowerCase();
          return label.includes(query) || desc.includes(query);
        });

        return (
          categoryLabel.includes(query) ||
          categoryDesc.includes(query) ||
          hasMatchingSettings
        );
      },
    );
  }, [searchQuery, t, locale]);

  const getFilteredSettings = (category: SettingCategory) => {
    const settingsList = SETTINGS_DEFINITIONS.filter(
      (s) => s.category === category,
    );

    if (!searchQuery.trim()) {
      return settingsList;
    }

    const query = searchQuery.toLowerCase();
    return settingsList.filter((setting) => {
      const label = t(setting.label).toLowerCase();
      const desc = setting.description[locale].toLowerCase();
      return label.includes(query) || desc.includes(query);
    });
  };

  if (isLoading) {
    return <Loading icon={SettingsIcon} message={t("loadingSettings")} />;
  }

  return (
    <Page>
      <PageHeader>
        <PageHeaderTrigger />
        <PageHeaderContent>
          <PageHeaderTitle>{t("title")}</PageHeaderTitle>
          <PageHeaderDescription>{t("description")}</PageHeaderDescription>
        </PageHeaderContent>
        <PageHeaderActions>
          <div className="text-sm text-muted-foreground">
            {t("description")}
          </div>
        </PageHeaderActions>
      </PageHeader>

      <PageContent>
        <PageContentInner>
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Settings Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCategories.map((categoryKey) => {
              const category = SETTINGS_CATEGORIES[categoryKey];
              const Icon = categoryIcons[categoryKey];
              const settings = getFilteredSettings(categoryKey);

              if (settings.length === 0) return null;

              return (
                <Card key={categoryKey} className="flex flex-col h-full">
                  <CardHeader className="space-y-3 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base leading-tight">
                            {t(category.label)}
                          </CardTitle>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {settings.length}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs leading-relaxed">
                      {t(category.description)}
                    </CardDescription>
                  </CardHeader>
                  <Separator />
                  <CardContent className="flex-1 p-0">
                    <div className="divide-y">
                      {getFilteredSettings(categoryKey).map(
                        (setting: SettingDefinition) => (
                          <SettingFieldWrapper
                            key={setting.id}
                            setting={setting}
                            onChange={(value) =>
                              handleChange(setting.key, value, setting.category)
                            }
                            searchQuery={searchQuery}
                          />
                        ),
                      )}
                    </div>
                  </CardContent>

                  {/* System-specific components */}
                  {categoryKey === "system" && (
                    <div className="p-4 pt-0 mt-auto">
                      <Separator className="mb-4" />
                      <ManualUpdateCheck />
                    </div>
                  )}

                  {/* Notifications-specific components */}
                  {categoryKey === "notifications" && (
                    <div className="p-4 pt-0 mt-auto">
                      <Separator className="mb-4" />
                      <NotificationPermissionButton />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Developer Tools Section */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-orange-500/10">
                    <Database className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Developer Tools</CardTitle>
                    <CardDescription className="text-xs">
                      Tools for testing and development
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Seed Data Button */}
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={(props) => (
                        <button
                          {...props}
                          className="inline-flex items-center justify-start gap-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                          disabled={seedData.isPending}
                        >
                          <Database className="h-4 w-4" />
                          <div className="flex-1 text-left">
                            <div className="font-medium text-sm">
                              Seed Test Data
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Add sample orders, suppliers & inventory
                            </div>
                          </div>
                        </button>
                      )}
                    />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Seed Test Data?</AlertDialogTitle>
                        <AlertDialogDescription
                          render={(props) => (
                            <div {...props}>
                              <p>This will add sample data to your database:</p>
                              <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>15 sample orders</li>
                                <li>8 suppliers</li>
                                <li>19 manufacturers</li>
                                <li>
                                  30+ inventory items (including low-stock and
                                  out-of-stock items)
                                </li>
                              </ul>
                              <p className="mt-2 text-sm">
                                This is useful for testing and development
                                purposes.
                              </p>
                            </div>
                          )}
                        />
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            seedData.mutate(undefined, {
                              onSuccess: () => {
                                // Invalidate all queries to refetch data
                                queryClient.invalidateQueries();
                              },
                            });
                          }}
                        >
                          Seed Data
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Clear Data Button */}
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={(props) => (
                        <button
                          {...props}
                          className="inline-flex items-center justify-start gap-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 text-destructive"
                          disabled={clearData.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                          <div className="flex-1 text-left">
                            <div className="font-medium text-sm">
                              Clear All Data
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Remove all orders, suppliers & inventory
                            </div>
                          </div>
                        </button>
                      )}
                    />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear All Data?</AlertDialogTitle>
                        <AlertDialogDescription
                          render={(props) => (
                            <div {...props}>
                              <p>
                                This will permanently delete all data from your
                                database:
                              </p>
                              <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>All orders</li>
                                <li>All suppliers</li>
                                <li>All manufacturers</li>
                                <li>
                                  All inventory items and their price history
                                </li>
                              </ul>
                              <p className="mt-2 font-semibold text-destructive">
                                This action cannot be undone!
                              </p>
                            </div>
                          )}
                        />
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            clearData.mutate(undefined, {
                              onSuccess: () => {
                                // Invalidate all queries to refetch data
                                queryClient.invalidateQueries();
                              },
                            });
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Clear Data
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>

          {filteredCategories.length === 0 && (
            <Card className="p-12">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="p-3 rounded-full bg-muted">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">{t("noResults")}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("noResultsDescription")}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </PageContentInner>
      </PageContent>
    </Page>
  );
}

// Setting Field Component
interface SettingFieldProps extends VariantProps<typeof settingRowVariants> {
  setting: SettingDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  searchQuery?: string;
}

// Wrapper to get value from settings array
function SettingFieldWrapper({
  setting,
  onChange,
  searchQuery,
}: Omit<SettingFieldProps, "value">) {
  const value = useSettingValue(setting.key, setting.defaultValue);

  return (
    <SettingField
      setting={setting}
      value={value}
      onChange={onChange}
      searchQuery={searchQuery}
    />
  );
}

function SettingField({
  setting,
  value,
  onChange,
  searchQuery,
}: SettingFieldProps) {
  const { t } = useTranslation("settings");
  const { locale } = useLocale();
  const [isFocused, setIsFocused] = useState(false);

  const label = t(setting.label);
  const description = setting.description[locale];

  // Highlight matching text
  const highlightText = (text: string) => {
    if (!searchQuery?.trim()) return text;

    const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark
          key={i}
          className="bg-primary/20 text-primary-foreground rounded px-0.5"
        >
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  const renderField = () => {
    switch (setting.type) {
      case "text":
        return (
          <Input
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              typeof setting.defaultValue === "string"
                ? setting.defaultValue
                : ""
            }
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="h-8 text-sm"
          />
        );

      case "number":
        return (
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              value={
                typeof value === "number"
                  ? value
                  : typeof setting.defaultValue === "number"
                    ? setting.defaultValue
                    : 0
              }
              onChange={(e) => onChange(Number(e.target.value))}
              min={setting.min}
              max={setting.max}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="h-8 w-16 text-sm"
            />
            {(setting.min !== undefined || setting.max !== undefined) && (
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {setting.min !== undefined && setting.max !== undefined
                  ? `${setting.min}-${setting.max}`
                  : setting.min !== undefined
                    ? `≥${setting.min}`
                    : `≤${setting.max}`}
              </span>
            )}
          </div>
        );

      case "boolean":
        return (
          <Switch
            checked={
              typeof value === "boolean"
                ? value
                : typeof setting.defaultValue === "boolean"
                  ? setting.defaultValue
                  : false
            }
            onCheckedChange={onChange}
          />
        );

      case "select":
        return (
          <Select
            value={
              typeof value === "string"
                ? value
                : typeof setting.defaultValue === "string"
                  ? setting.defaultValue
                  : ""
            }
            onValueChange={onChange}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {setting.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "multiselect":
        return (
          <Badge variant="outline" className="text-[10px]">
            {t("multiselect")}
          </Badge>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        settingRowVariants({ variant: isFocused ? "focused" : "default" }),
      )}
    >
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-1.5">
          <Label className="text-sm font-medium cursor-pointer leading-none">
            {highlightText(label)}
          </Label>
          {setting.required && (
            <Badge
              variant="destructive"
              className="text-[10px] h-4 px-1 leading-none"
            >
              *
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground leading-snug">
          {highlightText(description)}
        </p>
      </div>
      <div className="shrink-0 min-w-0">{renderField()}</div>
    </div>
  );
}
