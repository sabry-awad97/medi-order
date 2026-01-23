import { useState } from "react";
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
} from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

// أيقونات الفئات
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
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const resetSettings = useResetSettings();
  const exportSettings = useExportSettings();
  const importSettings = useImportSettings();

  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [activeTab, setActiveTab] = useState<SettingCategory>("general");
  const [hasChanges, setHasChanges] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // تحديث formData عند تحميل الإعدادات
  if (settings && Object.keys(formData).length === 0) {
    setFormData(settings);
  }

  const handleChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettings.mutate(formData, {
      onSuccess: () => {
        setHasChanges(false);
      },
    });
  };

  const handleResetConfirm = () => {
    resetSettings.mutate(undefined, {
      onSuccess: () => {
        // Reload settings after reset
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

  if (isLoading) {
    return <Loading icon={SettingsIcon} message="جاري تحميل الإعدادات..." />;
  }

  return (
    <Page>
      <PageHeader>
        <PageHeaderTrigger />
        <PageHeaderContent>
          <PageHeaderTitle>الإعدادات</PageHeaderTitle>
          <PageHeaderDescription>
            إدارة إعدادات النظام والتفضيلات
          </PageHeaderDescription>
        </PageHeaderContent>
        <PageHeaderActions>
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={handleImport}
          >
            <Upload className="h-5 w-5" />
            استيراد
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={handleExport}
          >
            <Download className="h-5 w-5" />
            تصدير
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="gap-2 text-destructive hover:text-destructive"
            onClick={() => setShowResetDialog(true)}
          >
            <RotateCcw className="h-5 w-5" />
            إعادة تعيين
          </Button>
          <Button
            size="lg"
            className="gap-2"
            onClick={handleSave}
            disabled={!hasChanges}
          >
            <Save className="h-5 w-5" />
            حفظ التغييرات
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <PageContent>
        <PageContentInner className="flex-1 flex flex-col min-h-0">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as SettingCategory)}
            className="flex-1 flex flex-col min-h-0"
          >
            <TabsList className="w-full justify-start mb-6 shrink-0">
              {Object.entries(SETTINGS_CATEGORIES).map(([key, category]) => {
                const Icon = categoryIcons[key as SettingCategory];
                return (
                  <TabsTrigger key={key} value={key} className="gap-2">
                    <Icon className="h-4 w-4" />
                    {category.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <div className="flex-1 min-h-0 overflow-y-auto pb-6">
              {Object.entries(SETTINGS_CATEGORIES).map(([key, category]) => (
                <TabsContent key={key} value={key} className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {React.createElement(
                          categoryIcons[key as SettingCategory],
                          {
                            className: "h-5 w-5",
                          },
                        )}
                        {category.label}
                      </CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {SETTINGS_DEFINITIONS.filter(
                        (s) => s.category === key,
                      ).map((setting) => (
                        <SettingField
                          key={setting.id}
                          setting={setting}
                          value={formData[setting.key]}
                          onChange={(value) => handleChange(setting.key, value)}
                        />
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </PageContentInner>
      </PageContent>

      {/* نافذة تأكيد إعادة التعيين */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>إعادة تعيين الإعدادات</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من إعادة تعيين جميع الإعدادات إلى القيم الافتراضية؟
              سيتم فقدان جميع التخصيصات الحالية.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              إعادة تعيين
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}

// مكون حقل الإعداد
interface SettingFieldProps {
  setting: SettingDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}

function SettingField({ setting, value, onChange }: SettingFieldProps) {
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
            className="text-right"
            dir="rtl"
          />
        );

      case "number":
        return (
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
            className="text-right"
          />
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
            items={setting.options || []}
          >
            <SelectTrigger className="text-right">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {setting.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "multiselect":
        // Multiselect component - قيد التطوير
        return (
          <div className="text-sm text-muted-foreground">
            متعدد الاختيار (قيد التطوير)
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-base font-medium">
            {setting.label}
            {setting.required && (
              <span className="text-destructive mr-1">*</span>
            )}
          </Label>
          <p className="text-sm text-muted-foreground">{setting.description}</p>
        </div>
        {setting.type !== "boolean" && (
          <div className="w-64">{renderField()}</div>
        )}
        {setting.type === "boolean" && renderField()}
      </div>
      <Separator />
    </div>
  );
}
