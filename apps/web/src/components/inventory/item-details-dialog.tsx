import { motion } from "motion/react";
import {
  Package,
  DollarSign,
  Shield,
  Calendar,
  Barcode,
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { InventoryItemWithStockResponse } from "@/api/inventory.api";

interface ItemDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItemWithStockResponse | null;
}

export function ItemDetailsDialog({
  open,
  onOpenChange,
  item,
}: ItemDetailsDialogProps) {
  if (!item) return null;

  const stockStatus =
    item.stock_quantity === 0
      ? "out_of_stock"
      : item.stock_quantity <= item.min_stock_level
        ? "low_stock"
        : "in_stock";

  const stockPercentage = Math.min(
    (item.stock_quantity / item.min_stock_level) * 100,
    100,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{item.name}</DialogTitle>
              {item.generic_name && (
                <DialogDescription className="text-base mt-1">
                  {item.generic_name}
                </DialogDescription>
              )}
            </div>
            <Badge
              variant={
                stockStatus === "out_of_stock"
                  ? "destructive"
                  : stockStatus === "low_stock"
                    ? "secondary"
                    : "default"
              }
              className="text-sm px-3 py-1"
            >
              {stockStatus === "out_of_stock"
                ? "Out of Stock"
                : stockStatus === "low_stock"
                  ? "Low Stock"
                  : "In Stock"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Stock Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-lg bg-linear-to-br from-primary/5 to-primary/10 border border-primary/20"
          >
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Stock Information
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Current Stock</p>
                <p className="text-3xl font-bold">{item.stock_quantity}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Min Level</p>
                <p className="text-3xl font-bold">{item.min_stock_level}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-3xl font-bold">
                  ${(item.stock_quantity * item.unit_price).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-muted-foreground">Stock Level</span>
                <span className="font-medium">
                  {stockPercentage.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full",
                    stockStatus === "out_of_stock"
                      ? "bg-red-500"
                      : stockStatus === "low_stock"
                        ? "bg-yellow-500"
                        : "bg-green-500",
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${stockPercentage}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>

          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <DetailField label="Concentration" value={item.concentration} />
              <DetailField label="Form" value={item.form} />
              {item.manufacturer && (
                <DetailField
                  label="Manufacturer"
                  value={item.manufacturer}
                  icon={Building2}
                />
              )}
              {item.barcode && (
                <DetailField
                  label="Barcode"
                  value={item.barcode}
                  icon={Barcode}
                  className="font-mono"
                />
              )}
            </div>
          </motion.div>

          <Separator />

          {/* Pricing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <DetailField
                label="Unit Price"
                value={`$${item.unit_price.toFixed(2)}`}
              />
              <DetailField
                label="Total Inventory Value"
                value={`$${(item.stock_quantity * item.unit_price).toFixed(2)}`}
              />
            </div>
          </motion.div>

          <Separator />

          {/* Classification */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <h3 className="font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Classification
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={item.requires_prescription ? "secondary" : "outline"}
                className="gap-1"
              >
                {item.requires_prescription ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {item.requires_prescription
                  ? "Prescription Required"
                  : "Over-the-Counter"}
              </Badge>
              {item.is_controlled && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Controlled Substance
                </Badge>
              )}
              <Badge variant={item.is_active ? "default" : "outline"}>
                {item.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </motion.div>

          {/* Storage & Notes */}
          {(item.storage_instructions || item.notes) && (
            <>
              <Separator />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
                {item.storage_instructions && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">
                      Storage Instructions
                    </h4>
                    <p className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
                      {item.storage_instructions}
                    </p>
                  </div>
                )}
                {item.notes && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Additional Notes</h4>
                    <p className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
                      {item.notes}
                    </p>
                  </div>
                )}
              </motion.div>
            </>
          )}

          <Separator />

          {/* Timestamps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">
                  {format(new Date(item.created_at), "PPp")}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {format(new Date(item.updated_at), "PPp")}
                </p>
              </div>
              {item.last_restocked_at && (
                <div className="space-y-1">
                  <p className="text-muted-foreground">Last Restocked</p>
                  <p className="font-medium">
                    {format(new Date(item.last_restocked_at), "PPp")}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Detail Field Component
interface DetailFieldProps {
  label: string;
  value: string;
  icon?: React.ElementType;
  className?: string;
}

function DetailField({
  label,
  value,
  icon: Icon,
  className,
}: DetailFieldProps) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className={cn("font-medium", className)}>{value}</p>
    </div>
  );
}
