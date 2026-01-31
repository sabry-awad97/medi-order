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
import { useTranslation } from "@meditrack/i18n";

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
  const { t } = useTranslation("inventory");

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

  const getStockStatusLabel = () => {
    if (stockStatus === "out_of_stock") return t("stockStatus.outOfStock");
    if (stockStatus === "low_stock") return t("stockStatus.lowStock");
    return t("stockStatus.inStock");
  };

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
              {getStockStatusLabel()}
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
              {t("itemDetails.stockInfo")}
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {t("itemDetails.currentStock")}
                </p>
                <p className="text-3xl font-bold">{item.stock_quantity}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {t("itemDetails.minLevel")}
                </p>
                <p className="text-3xl font-bold">{item.min_stock_level}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {t("itemDetails.totalValue")}
                </p>
                <p className="text-3xl font-bold">
                  ${(item.stock_quantity * item.unit_price).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-muted-foreground">
                  {t("itemDetails.stockLevel")}
                </span>
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
              {t("itemDetails.basicInfo")}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <DetailField
                label={t("itemDetails.concentration")}
                value={item.concentration}
              />
              <DetailField label={t("itemDetails.form")} value={item.form} />
              {item.manufacturer && (
                <DetailField
                  label={t("itemDetails.manufacturer")}
                  value={item.manufacturer}
                  icon={Building2}
                />
              )}
              {item.barcode && (
                <DetailField
                  label={t("itemDetails.barcode")}
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
              {t("itemDetails.pricing")}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <DetailField
                label={t("itemDetails.unitPrice")}
                value={`$${item.unit_price.toFixed(2)}`}
              />
              <DetailField
                label={t("itemDetails.totalInventoryValue")}
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
              {t("itemDetails.classification")}
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
                  ? t("itemDetails.prescriptionRequired")
                  : t("itemDetails.overTheCounter")}
              </Badge>
              {item.is_controlled && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {t("itemDetails.controlledSubstance")}
                </Badge>
              )}
              <Badge variant={item.is_active ? "default" : "outline"}>
                {item.is_active
                  ? t("itemDetails.active")
                  : t("itemDetails.inactive")}
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
                      {t("itemDetails.storageInstructions")}
                    </h4>
                    <p className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
                      {item.storage_instructions}
                    </p>
                  </div>
                )}
                {item.notes && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">
                      {t("itemDetails.additionalNotes")}
                    </h4>
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
              {t("itemDetails.timeline")}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">
                  {t("itemDetails.created")}
                </p>
                <p className="font-medium">
                  {format(new Date(item.created_at), "PPp")}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">
                  {t("itemDetails.lastUpdated")}
                </p>
                <p className="font-medium">
                  {format(new Date(item.updated_at), "PPp")}
                </p>
              </div>
              {item.last_restocked_at && (
                <div className="space-y-1">
                  <p className="text-muted-foreground">
                    {t("itemDetails.lastRestocked")}
                  </p>
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
