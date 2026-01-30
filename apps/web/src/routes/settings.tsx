import { useState, useEffect } from "react";
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  Download,
  Upload,
  Package,
  Users,
  Bell,
  MessageSquare,
  Palette,
  Cog,
  Check,
  Search,
  X,
} from "lucide-react";
import { useTranslation } from "@meditrack/i18n";
import { useLocale } from "@meditrack/i18n";
import { cva, type VariantProps } from "class-variance-authority";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Page,
  PageHeader,
  PageHeaderTrigger,
  PageHeaderContent,
  PageHeaderTitle,
  PageHeaderDescription,
  PageHeaderActions,
  PageContent,
  PageContentInner,
} from "@/components/ui/page";
import { Loading } from "@/components/ui/loading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  useSettings,
  useUpdateSettings,
  useResetSettings,
  useExportSettings,
  useImportSettings,
} from "@/hooks";
import {
  SETTINGS_DEFINITIONS,
  SETTINGS_CATEGORIES,
  getAllDefaultValues,
} from "@/lib/settings-definitions";
import type { Settings } from "@/lib/types-settings";
import type { SettingCategory, SettingDefinition } from "@/lib/types-settings";
import { ManualUpdateCheck } from "@/components/manual-update-check";
import { useState as useNotificationState } from "react";

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
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const resetSettings = useResetSettings();
  const exportSettings = useExportSettings();
  const importSettings = useImportSettings();

  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Update formData when settings load
  useEffect(() => {
    if (settings && Object.keys(formData).length === 0) {
      setFormData(settings);
    }
  }, [settings, formData]);

  // Sync language setting with i18n
  useEffect(() => {
    if (settings?.defaultLanguage && settings.defaultLanguage !== locale) {
      setLocale(settings.defaultLanguage as "en" | "ar");
    }
  }, [settings?.defaultLanguage, locale, setLocale]);

  const handleChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setSaveSuccess(false);

    // If language is changed, update i18n immediately for better UX
    if (key === "defaultLanguage" && (value === "en" || value === "ar")) {
      setLocale(value);
    }

    // If theme is changed, update theme immediately for better UX
    if (
      key === "defaultTheme" &&
      (value === "light" || value === "dark" || value === "system")
    ) {
      // We'll need to import useTheme hook
      // For now, we'll let the save button handle it
    }
  };

  const handleSave = () => {
    updateSettings.mutate(formData, {
      onSuccess: () => {
        setHasChanges(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      },
    });
  };

  const handleResetConfirm = () => {
    resetSettings.mutate(undefined, {
      onSuccess: () => {
        const defaults = getAllDefaultValues();
        setFormData(defaults as Settings);
        setHasChanges(false);
        setShowResetDialog(false);
      },
    });
  };

  const handleExport = () => {
    exportSettings.mutate();
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        importSettings.mutate(file, {
          onSuccess: () => {
            setHasChanges(false);
          },
        });
      }
    };
    input.click();
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
          const desc = t(setting.description).toLowerCase();
          return label.includes(query) || desc.includes(query);
        });

        return (
          categoryLabel.includes(query) ||
          categoryDesc.includes(query) ||
          hasMatchingSettings
        );
      },
    );
  }, [searchQuery, t]);

  const getFilteredSettings = (category: SettingCategory) => {
    const settings = SETTINGS_DEFINITIONS.filter(
      (s) => s.category === category,
    );

    if (!searchQuery.trim()) {
      return settings;
    }

    const query = searchQuery.toLowerCase();
    return settings.filter((setting) => {
      const label = t(setting.label).toLowerCase();
      const desc = t(setting.description).toLowerCase();
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
          <Button variant="outline" size="lg" onClick={handleImport}>
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">{t("import")}</span>
          </Button>

          <Button variant="outline" size="lg" onClick={handleExport}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{t("export")}</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowResetDialog(true)}
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">{t("reset")}</span>
          </Button>

          <Button
            size="lg"
            onClick={handleSave}
            disabled={!hasChanges}
            className={cn(saveSuccess && "bg-green-600 hover:bg-green-700")}
          >
            {saveSuccess ? (
              <>
                <Check className="h-4 w-4" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{t("saveChanges")}</span>
              </>
            )}
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <PageContent>
        <PageContentInner>
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search settings..."
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
                      {settings.map((setting) => (
                        <SettingField
                          key={setting.id}
                          setting={setting}
                          value={formData[setting.key]}
                          onChange={(value) => handleChange(setting.key, value)}
                          searchQuery={searchQuery}
                        />
                      ))}
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

          {filteredCategories.length === 0 && (
            <Card className="p-12">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="p-3 rounded-full bg-muted">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">No results found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try adjusting your search query
                  </p>
                </div>
              </div>
            </Card>
          )}
        </PageContentInner>
      </PageContent>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("resetTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("resetDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetConfirm}>
              {t("actions.reset")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

function SettingField({
  setting,
  value,
  onChange,
  searchQuery,
}: SettingFieldProps) {
  const { t } = useTranslation("settings");
  const [isFocused, setIsFocused] = useState(false);

  const label = t(setting.label);
  const description = t(setting.description);

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
