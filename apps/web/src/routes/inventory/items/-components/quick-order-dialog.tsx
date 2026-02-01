import { useState, useEffect } from "react";
import { ShoppingCart, AlertCircle } from "lucide-react";
import { useTranslation } from "@meditrack/i18n";

import { FormDialog } from "@/components/feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { InventoryItemWithStockResponse } from "@/api/inventory.api";

interface QuickOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItemWithStockResponse | null;
  onOrder: (itemId: string, quantity: number, notes?: string) => void;
}

export function QuickOrderDialog({
  open,
  onOpenChange,
  item,
  onOrder,
}: QuickOrderDialogProps) {
  const { t } = useTranslation("inventory");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (item && open) {
      // Suggest ordering enough to reach 2x min level
      const suggestedQuantity = Math.max(
        item.min_stock_level * 2 - item.stock_quantity,
        item.min_stock_level,
      );
      setQuantity(suggestedQuantity.toString());
      setNotes("");
    }
  }, [item, open]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError(t("quickOrderDialog.validation.validQuantity"));
      return;
    }

    onOrder(item!.id, qty, notes || undefined);
    handleClose();
  };

  const handleClose = () => {
    setQuantity("");
    setNotes("");
    setError("");
    onOpenChange(false);
  };

  if (!item) return null;

  const orderQuantity = parseInt(quantity) || 0;
  const newStockLevel = item.stock_quantity + orderQuantity;
  const unitPrice =
    typeof item.unit_price === "string"
      ? parseFloat(item.unit_price)
      : item.unit_price;
  const estimatedCost = orderQuantity * unitPrice;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("quickOrderDialog.title")}
      description={t("quickOrderDialog.description", { name: item.name })}
      icon={ShoppingCart}
      size="md"
      onSubmit={handleSubmit}
      onCancel={handleClose}
      submitLabel={t("quickOrderDialog.createOrder")}
      submitDisabled={!quantity || parseInt(quantity) <= 0}
      cancelLabel={t("quickOrderDialog.cancel")}
    >
      <div className="space-y-6">
        {/* Current Info */}
        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t("quickOrderDialog.currentStock")}
            </span>
            <span className="text-lg font-semibold">{item.stock_quantity}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t("quickOrderDialog.minLevel")}
            </span>
            <span className="text-lg font-semibold">
              {item.min_stock_level}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t("quickOrderDialog.unitPrice")}
            </span>
            <span className="text-lg font-semibold">
              ${unitPrice.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Order Quantity Input */}
        <div className="space-y-2">
          <Label htmlFor="quantity">
            {t("quickOrderDialog.orderQuantity")}{" "}
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
            placeholder={t("quickOrderDialog.quantityPlaceholder")}
            className={cn(error && "border-destructive")}
          />
          {error && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {error}
            </p>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">{t("quickOrderDialog.notes")}</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("quickOrderDialog.notesPlaceholder")}
            rows={3}
          />
        </div>

        {/* Preview */}
        {quantity && parseInt(quantity) > 0 && (
          <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
            <h4 className="font-medium text-sm">
              {t("quickOrderDialog.preview")}
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("quickOrderDialog.newStockLevel")}
                </span>
                <span className="font-medium text-green-600">
                  {item.stock_quantity} → {newStockLevel}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("quickOrderDialog.estimatedCost")}
                </span>
                <span className="font-semibold text-lg">
                  ${estimatedCost.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="text-xs">{t("quickOrderDialog.info")}</span>
            </div>
          </div>
        )}
      </div>
    </FormDialog>
  );
}
