import { useState } from "react";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown, Package, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InventoryItemWithStockResponse } from "@/api/inventory.api";

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItemWithStockResponse | null;
  onAdjust: (itemId: string, adjustment: number, reason?: string) => void;
}

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  item,
  onAdjust,
}: StockAdjustmentDialogProps) {
  const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract">(
    "add",
  );
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("Please enter a valid quantity");
      return;
    }

    if (adjustmentType === "subtract" && item && qty > item.stock_quantity) {
      setError(
        `Cannot subtract more than current stock (${item.stock_quantity})`,
      );
      return;
    }

    const adjustment = adjustmentType === "add" ? qty : -qty;
    onAdjust(item!.id, adjustment, reason.trim() || undefined);
    handleClose();
  };

  const handleClose = () => {
    setQuantity("");
    setReason("");
    setError("");
    setAdjustmentType("add");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Adjust Stock
          </DialogTitle>
          <DialogDescription>
            Modify stock levels for {item.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Stock Info */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Current Stock
              </span>
              <span className="text-2xl font-bold">{item.stock_quantity}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Min Level</span>
              <span className="font-medium">{item.min_stock_level}</span>
            </div>
          </div>

          {/* Adjustment Type */}
          <div className="space-y-3">
            <Label>Adjustment Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={adjustmentType === "add" ? "default" : "outline"}
                className={cn(
                  "gap-2 transition-all",
                  adjustmentType === "add" &&
                    "ring-2 ring-primary ring-offset-2",
                )}
                onClick={() => {
                  setAdjustmentType("add");
                  setError("");
                }}
              >
                <TrendingUp className="h-4 w-4" />
                Add Stock
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
                  setError("");
                }}
              >
                <TrendingDown className="h-4 w-4" />
                Remove Stock
              </Button>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity <span className="text-destructive">*</span>
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
              placeholder="Enter quantity"
              className={cn(error && "border-destructive")}
            />
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-destructive flex items-center gap-1"
              >
                <AlertCircle className="h-3 w-3" />
                {error}
              </motion.p>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Received new shipment, Damaged items, etc."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Preview */}
          {quantity && parseInt(quantity) > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-lg border bg-muted/30 space-y-3"
            >
              <h4 className="font-medium text-sm">Preview</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  New Stock Level
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
                    {stockStatus === "out_of_stock"
                      ? "Out of Stock"
                      : stockStatus === "low_stock"
                        ? "Low Stock"
                        : "In Stock"}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Change</span>
                <span
                  className={cn(
                    "font-medium",
                    adjustmentType === "add"
                      ? "text-green-600"
                      : "text-red-600",
                  )}
                >
                  {adjustmentType === "add" ? "+" : "-"}
                  {quantity}
                </span>
              </div>
            </motion.div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!quantity || parseInt(quantity) <= 0}
            >
              Confirm Adjustment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
