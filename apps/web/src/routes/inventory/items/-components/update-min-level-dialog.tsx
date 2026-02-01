import { useState, useEffect } from "react";
import { AlertCircle, Bell } from "lucide-react";
import { useTranslation } from "@meditrack/i18n";

import { FormDialog } from "@/components/feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { InventoryItemWithStockResponse } from "@/api/inventory.api";

interface UpdateMinLevelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItemWithStockResponse | null;
  onUpdate: (itemId: string, minLevel: number) => void;
}

export function UpdateMinLevelDialog({
  open,
  onOpenChange,
  item,
  onUpdate,
}: UpdateMinLevelDialogProps) {
  const { t } = useTranslation("inventory");
  const [minLevel, setMinLevel] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (item && open) {
      setMinLevel(item.min_stock_level.toString());
    }
  }, [item, open]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const level = parseInt(minLevel);
    if (isNaN(level) || level < 0) {
      setError(t("minLevelDialog.validation.validLevel"));
      return;
    }

    onUpdate(item!.id, level);
    handleClose();
  };

  const handleClose = () => {
    setMinLevel("");
    setError("");
    onOpenChange(false);
  };

  if (!item) return null;

  const newLevel = parseInt(minLevel) || 0;
  const currentStock = item.stock_quantity;
  const willBeLowStock = currentStock > 0 && currentStock <= newLevel;
  const isIncreasing = newLevel > item.min_stock_level;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("minLevelDialog.title")}
      description={t("minLevelDialog.description", { name: item.name })}
      icon={Bell}
      size="md"
      onSubmit={handleSubmit}
      onCancel={handleClose}
      submitLabel={t("minLevelDialog.update")}
      submitDisabled={!minLevel || parseInt(minLevel) < 0}
      cancelLabel={t("minLevelDialog.cancel")}
    >
      <div className="space-y-6">
        {/* Current Info */}
        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t("minLevelDialog.currentStock")}
            </span>
            <span className="text-lg font-semibold">{currentStock}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t("minLevelDialog.currentMinLevel")}
            </span>
            <span className="text-lg font-semibold">
              {item.min_stock_level}
            </span>
          </div>
        </div>

        {/* Min Level Input */}
        <div className="space-y-2">
          <Label htmlFor="minLevel">
            {t("minLevelDialog.newMinLevel")}{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="minLevel"
            type="number"
            min="0"
            value={minLevel}
            onChange={(e) => {
              setMinLevel(e.target.value);
              setError("");
            }}
            placeholder={t("minLevelDialog.placeholder")}
            className={cn(error && "border-destructive")}
          />
          {error && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {error}
            </p>
          )}
        </div>

        {/* Preview */}
        {minLevel && parseInt(minLevel) >= 0 && (
          <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
            <h4 className="font-medium text-sm">
              {t("minLevelDialog.preview")}
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("minLevelDialog.change")}
                </span>
                <span
                  className={cn(
                    "font-medium",
                    isIncreasing ? "text-orange-600" : "text-green-600",
                  )}
                >
                  {item.min_stock_level} → {newLevel}
                </span>
              </div>
              {willBeLowStock && (
                <div className="flex items-start gap-2 p-2 rounded bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span className="text-xs">{t("minLevelDialog.warning")}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </FormDialog>
  );
}
