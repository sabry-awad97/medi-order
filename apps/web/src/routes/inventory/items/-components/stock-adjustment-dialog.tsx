import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Package,
  AlertCircle,
  Truck,
  ShoppingCart,
  AlertTriangle,
  Calendar,
  RotateCcw,
  ArrowRightLeft,
  PlusCircle,
  Edit3,
} from "lucide-react";
import { useTranslation } from "@meditrack/i18n";

import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  InventoryItemWithStockResponse,
  StockAdjustmentType,
} from "@/api/inventory.api";

interface AdjustmentTypeOption {
  value: StockAdjustmentType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  category: "add" | "subtract";
  description: string;
}

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItemWithStockResponse | null;
  onAdjust: (
    itemId: string,
    adjustment: number,
    reason?: string,
    adjustmentType?: string,
  ) => void;
}

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  item,
  onAdjust,
}: StockAdjustmentDialogProps) {
  const { t } = useTranslation("inventory");
  const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract">(
    "add",
  );
  const [selectedType, setSelectedType] =
    useState<StockAdjustmentType>("manual_adjustment");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  // Define adjustment type options with icons and colors
  const adjustmentTypes: AdjustmentTypeOption[] = [
    {
      value: "manual_adjustment",
      label: t("stockHistory.adjustmentTypes.manual_adjustment"),
      icon: Edit3,
      color: "text-blue-600",
      category: "add",
      description: t("stockHistory.adjustmentDescriptions.manual_adjustment"),
    },
    {
      value: "order_arrival",
      label: t("stockHistory.adjustmentTypes.order_arrival"),
      icon: Truck,
      color: "text-green-600",
      category: "add",
      description: t("stockHistory.adjustmentDescriptions.order_arrival"),
    },
    {
      value: "return",
      label: t("stockHistory.adjustmentTypes.return"),
      icon: RotateCcw,
      color: "text-purple-600",
      category: "add",
      description: t("stockHistory.adjustmentDescriptions.return"),
    },
    {
      value: "initial_stock",
      label: t("stockHistory.adjustmentTypes.initial_stock"),
      icon: PlusCircle,
      color: "text-indigo-600",
      category: "add",
      description: t("stockHistory.adjustmentDescriptions.initial_stock"),
    },
    {
      value: "sale",
      label: t("stockHistory.adjustmentTypes.sale"),
      icon: ShoppingCart,
      color: "text-emerald-600",
      category: "subtract",
      description: t("stockHistory.adjustmentDescriptions.sale"),
    },
    {
      value: "damage",
      label: t("stockHistory.adjustmentTypes.damage"),
      icon: AlertTriangle,
      color: "text-orange-600",
      category: "subtract",
      description: t("stockHistory.adjustmentDescriptions.damage"),
    },
    {
      value: "expiry",
      label: t("stockHistory.adjustmentTypes.expiry"),
      icon: Calendar,
      color: "text-red-600",
      category: "subtract",
      description: t("stockHistory.adjustmentDescriptions.expiry"),
    },
    {
      value: "transfer",
      label: t("stockHistory.adjustmentTypes.transfer"),
      icon: ArrowRightLeft,
      color: "text-amber-600",
      category: "subtract",
      description: t("stockHistory.adjustmentDescriptions.transfer"),
    },
  ];

  const addTypes = adjustmentTypes.filter((t) => t.category === "add");
  const subtractTypes = adjustmentTypes.filter(
    (t) => t.category === "subtract",
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError(t("stockAdjustment.validation.validQuantity"));
      return;
    }

    if (adjustmentType === "subtract" && item && qty > item.stock_quantity) {
      setError(
        t("stockAdjustment.validation.cannotSubtract", {
          stock: item.stock_quantity,
        }),
      );
      return;
    }

    const adjustment = adjustmentType === "add" ? qty : -qty;
    onAdjust(item!.id, adjustment, reason.trim() || undefined, selectedType);
    handleClose();
  };

  const handleClose = () => {
    setQuantity("");
    setReason("");
    setError("");
    setAdjustmentType("add");
    setSelectedType("manual_adjustment");
    onOpenChange(false);
  };

  if (!item) return null;

  const newStock =
    adjustmentType === "add"
      ? item.stock_quantity + (parseInt(quantity) || 0)
      : item.stock_quantity - (parseInt(quantity) || 0);

  const stockStatus =
    newStock <= 0
      ? "out_of_stock"
      : newStock <= item.min_stock_level
        ? "low_stock"
        : "in_stock";

  const getStockStatusLabel = () => {
    if (stockStatus === "out_of_stock") return t("stockStatus.outOfStock");
    if (stockStatus === "low_stock") return t("stockStatus.lowStock");
    return t("stockStatus.inStock");
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("stockAdjustment.title")}
      description={t("stockAdjustment.description", { name: item.name })}
      icon={Package}
      size="xl"
      onSubmit={handleSubmit}
      onCancel={handleClose}
      submitLabel={t("stockAdjustment.confirmAdjustment")}
      submitDisabled={!quantity || parseInt(quantity) <= 0}
      cancelLabel={t("stockAdjustment.cancel")}
    >
      <div className="space-y-6">
        {/* Current Stock Info */}
        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t("stockAdjustment.currentStock")}
            </span>
            <span className="text-2xl font-bold">{item.stock_quantity}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t("stockAdjustment.minLevel")}
            </span>
            <span className="font-medium">{item.min_stock_level}</span>
          </div>
        </div>

        {/* Adjustment Type Selection */}
        <div className="space-y-3">
          <Label>{t("stockAdjustment.adjustmentType")}</Label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={adjustmentType === "add" ? "default" : "outline"}
              className={cn(
                "gap-2 transition-all",
                adjustmentType === "add" && "ring-2 ring-primary ring-offset-2",
              )}
              onClick={() => {
                setAdjustmentType("add");
                setSelectedType("manual_adjustment");
                setError("");
              }}
            >
              <TrendingUp className="h-4 w-4" />
              {t("stockAdjustment.addStock")}
            </Button>
            <Button
              type="button"
              variant={adjustmentType === "subtract" ? "default" : "outline"}
              className={cn(
                "gap-2 transition-all",
                adjustmentType === "subtract" &&
                  "ring-2 ring-primary ring-offset-2",
              )}
              onClick={() => {
                setAdjustmentType("subtract");
                setSelectedType("sale");
                setError("");
              }}
            >
              <TrendingDown className="h-4 w-4" />
              {t("stockAdjustment.removeStock")}
            </Button>
          </div>
        </div>

        {/* Adjustment Reason Type */}
        <div className="space-y-3">
          <Label>{t("stockAdjustment.reasonType")}</Label>
          <div className="grid grid-cols-2 gap-2">
            {(adjustmentType === "add" ? addTypes : subtractTypes).map(
              (type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSelectedType(type.value)}
                    className={cn(
                      "p-3 rounded-lg border transition-colors text-left",
                      "hover:border-primary/50 hover:bg-accent/50",
                      isSelected
                        ? "border-primary bg-accent"
                        : "border-border bg-background",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className={cn("h-4 w-4 mt-0.5", type.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{type.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {type.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              },
            )}
          </div>
        </div>

        {/* Quantity Input */}
        <div className="space-y-2">
          <Label htmlFor="quantity">
            {t("stockAdjustment.quantity")}{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              setError("");
            }}
            placeholder={t("stockAdjustment.quantityPlaceholder")}
            className={cn(error && "border-destructive")}
          />
          {error && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {error}
            </p>
          )}
        </div>

        {/* Reason */}
        <div className="space-y-2">
          <Label htmlFor="reason">{t("stockAdjustment.reason")}</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("stockAdjustment.reasonPlaceholder")}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Preview */}
        {quantity && parseInt(quantity) > 0 && (
          <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
            <h4 className="font-medium text-sm">
              {t("stockAdjustment.preview")}
            </h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("stockAdjustment.newStockLevel")}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{newStock}</span>
                <Badge
                  variant={
                    stockStatus === "out_of_stock"
                      ? "destructive"
                      : stockStatus === "low_stock"
                        ? "secondary"
                        : "default"
                  }
                >
                  {getStockStatusLabel()}
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t("stockAdjustment.change")}
              </span>
              <span
                className={cn(
                  "font-medium",
                  adjustmentType === "add" ? "text-green-600" : "text-red-600",
                )}
              >
                {adjustmentType === "add" ? "+" : "-"}
                {quantity}
              </span>
            </div>
          </div>
        )}
      </div>
    </FormDialog>
  );
}
