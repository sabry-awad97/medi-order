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
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { useTranslation, useDirection } from "@meditrack/i18n";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type {
  InventoryItemWithStockResponse,
  PriceHistoryEntry,
} from "@/api/inventory.api";
import { PriceHistoryChart } from "./price-history-chart";

interface ItemDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItemWithStockResponse | null;
  priceHistory?: PriceHistoryEntry[];
}

export function ItemDetailsDialog({
  open,
  onOpenChange,
  item,
  priceHistory = [],
}: ItemDetailsDialogProps) {
  const { t } = useTranslation("inventory");
  const { isRTL } = useDirection();

  if (!item) return null;

  const unitPrice =
    typeof item.unit_price === "string"
      ? parseFloat(item.unit_price)
      : item.unit_price;
  const totalValue = item.stock_quantity * unitPrice;

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
      <DialogContent className="sm:max-w-5xl h-[85vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <div
          className={cn(
            "px-6 py-4 border-b shrink-0 bg-muted/30",
            isRTL ? "pl-14" : "pr-14",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-4",
              isRTL ? "flex-row-reverse" : "justify-between",
            )}
          >
            <Badge
              variant={
                stockStatus === "out_of_stock"
                  ? "destructive"
                  : stockStatus === "low_stock"
                    ? "secondary"
                    : "default"
              }
              className={cn(
                "text-sm px-4 py-1.5 font-medium",
                isRTL ? "order-first" : "order-last",
              )}
            >
              {getStockStatusLabel()}
            </Badge>
            <div className={cn("flex-1", isRTL && "text-right")}>
              <DialogTitle className="text-2xl font-bold">
                {item.name}
              </DialogTitle>
              {item.generic_name && (
                <DialogDescription className="text-base mt-1">
                  {item.generic_name}
                </DialogDescription>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 h-0">
          <div className="p-6">
            {/* Price History Chart - Full Width */}
            {priceHistory && priceHistory.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="mb-6"
              >
                <PriceHistoryChart
                  data={priceHistory}
                  currentPrice={unitPrice}
                />
              </motion.div>
            )}

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Stock & Pricing */}
              <div className="space-y-6">
                {/* Stock Overview Card */}
                <motion.div
                  initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card>
                    <CardHeader className={cn(isRTL && "text-right")}>
                      <CardTitle
                        className={cn(
                          "flex items-center gap-2 text-lg",
                          isRTL && "flex-row-reverse justify-end",
                        )}
                      >
                        <Package className="h-5 w-5 text-primary" />
                        {t("itemDetails.stockInfo")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent
                      className={cn("space-y-4", isRTL && "text-right")}
                    >
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {t("itemDetails.currentStock")}
                          </p>
                          <p className="text-2xl font-bold">
                            {item.stock_quantity}
                          </p>
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {t("itemDetails.minLevel")}
                          </p>
                          <p className="text-2xl font-bold text-muted-foreground">
                            {item.min_stock_level}
                          </p>
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {t("itemDetails.totalValue")}
                          </p>
                          <p className="text-2xl font-bold text-primary">
                            ${totalValue.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <div
                          className={cn(
                            "flex items-center justify-between text-sm",
                            isRTL && "flex-row-reverse",
                          )}
                        >
                          <span className="text-muted-foreground">
                            {t("itemDetails.stockLevel")}
                          </span>
                          <span className="font-medium">
                            {stockPercentage.toFixed(0)}%
                          </span>
                        </div>
                        <Progress
                          value={stockPercentage}
                          className={cn(
                            "h-2",
                            stockStatus === "out_of_stock" &&
                              "[&>div]:bg-destructive",
                            stockStatus === "low_stock" &&
                              "[&>div]:bg-yellow-500",
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Pricing Card */}
                <motion.div
                  initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <CardHeader className={cn(isRTL && "text-right")}>
                      <CardTitle
                        className={cn(
                          "flex items-center gap-2 text-lg",
                          isRTL && "flex-row-reverse justify-end",
                        )}
                      >
                        <DollarSign className="h-5 w-5 text-green-600 dark:text-green-500" />
                        {t("itemDetails.pricing")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className={cn(isRTL && "text-right")}>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {t("itemDetails.unitPrice")}
                          </p>
                          <p className="text-3xl font-bold text-green-600 dark:text-green-500">
                            ${unitPrice.toFixed(2)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {t("itemDetails.totalInventoryValue")}
                          </p>
                          <p className="text-3xl font-bold text-green-600 dark:text-green-500">
                            ${totalValue.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Classification Card */}
                <motion.div
                  initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card>
                    <CardHeader className={cn(isRTL && "text-right")}>
                      <CardTitle
                        className={cn(
                          "flex items-center gap-2 text-lg",
                          isRTL && "flex-row-reverse justify-end",
                        )}
                      >
                        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                        {t("itemDetails.classification")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className={cn(isRTL && "text-right")}>
                      <div
                        className={cn(
                          "flex flex-wrap gap-2",
                          isRTL && "flex-row-reverse",
                        )}
                      >
                        <Badge
                          variant={
                            item.requires_prescription ? "default" : "secondary"
                          }
                        >
                          {item.requires_prescription
                            ? t("itemDetails.prescriptionRequired")
                            : t("itemDetails.overTheCounter")}
                        </Badge>
                        {item.is_controlled && (
                          <Badge
                            variant="destructive"
                            className={cn("gap-1", isRTL && "flex-row-reverse")}
                          >
                            <AlertTriangle className="h-3 w-3" />
                            {t("itemDetails.controlledSubstance")}
                          </Badge>
                        )}
                        <Badge
                          variant={item.is_active ? "default" : "outline"}
                          className={cn("gap-1", isRTL && "flex-row-reverse")}
                        >
                          {item.is_active ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              {t("itemDetails.active")}
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                              {t("itemDetails.inactive")}
                            </>
                          )}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Right Column - Details & Information */}
              <div className="space-y-6">
                {/* Basic Information Card */}
                <motion.div
                  initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card>
                    <CardHeader className={cn(isRTL && "text-right")}>
                      <CardTitle
                        className={cn(
                          "flex items-center gap-2 text-lg",
                          isRTL && "flex-row-reverse justify-end",
                        )}
                      >
                        <FileText className="h-5 w-5 text-purple-600 dark:text-purple-500" />
                        {t("itemDetails.basicInfo")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent
                      className={cn("space-y-3", isRTL && "text-right")}
                    >
                      <DetailField
                        icon={<FileText className="h-4 w-4" />}
                        label={t("itemDetails.concentration")}
                        value={item.concentration || t("table.na")}
                      />
                      <Separator />
                      <DetailField
                        icon={<Package className="h-4 w-4" />}
                        label={t("itemDetails.form")}
                        value={item.form}
                      />
                      <Separator />
                      <DetailField
                        icon={<Building2 className="h-4 w-4" />}
                        label={t("itemDetails.manufacturer")}
                        value={item.manufacturer_name || t("table.na")}
                      />
                      <Separator />
                      <DetailField
                        icon={<Barcode className="h-4 w-4" />}
                        label={t("itemDetails.barcode")}
                        value={
                          item.barcodes.find((b) => b.is_primary)?.barcode ||
                          item.barcodes[0]?.barcode ||
                          t("table.na")
                        }
                      />
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Storage & Notes Card */}
                {(item.storage_instructions || item.notes) && (
                  <motion.div
                    initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card>
                      <CardHeader className={cn(isRTL && "text-right")}>
                        <CardTitle
                          className={cn(
                            "flex items-center gap-2 text-lg",
                            isRTL && "flex-row-reverse justify-end",
                          )}
                        >
                          <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-500" />
                          {t("itemDetails.storageInstructions")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent
                        className={cn("space-y-4", isRTL && "text-right")}
                      >
                        {item.storage_instructions && (
                          <div className="space-y-2">
                            <p
                              className={cn(
                                "text-sm text-muted-foreground leading-relaxed",
                                isRTL && "text-right",
                              )}
                            >
                              {item.storage_instructions}
                            </p>
                          </div>
                        )}
                        {item.storage_instructions && item.notes && (
                          <Separator />
                        )}
                        {item.notes && (
                          <div className="space-y-2">
                            <h4
                              className={cn(
                                "font-medium text-sm flex items-center gap-2",
                                isRTL && "flex-row-reverse justify-end",
                              )}
                            >
                              <FileText className="h-4 w-4" />
                              {t("itemDetails.additionalNotes")}
                            </h4>
                            <p
                              className={cn(
                                "text-sm text-muted-foreground leading-relaxed",
                                isRTL && "text-right",
                              )}
                            >
                              {item.notes}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Timeline Card */}
                <motion.div
                  initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card>
                    <CardHeader className={cn(isRTL && "text-right")}>
                      <CardTitle
                        className={cn(
                          "flex items-center gap-2 text-lg",
                          isRTL && "flex-row-reverse justify-end",
                        )}
                      >
                        <Calendar className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        {t("itemDetails.timeline")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent
                      className={cn("space-y-3", isRTL && "text-right")}
                    >
                      <TimelineItem
                        icon={<Calendar className="h-4 w-4 text-primary" />}
                        label={t("itemDetails.created")}
                        value={format(new Date(item.created_at), "PPp")}
                        isRTL={isRTL}
                      />
                      {item.updated_at && (
                        <>
                          <Separator />
                          <TimelineItem
                            icon={
                              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                            }
                            label={t("itemDetails.lastUpdated")}
                            value={format(new Date(item.updated_at), "PPp")}
                            isRTL={isRTL}
                          />
                        </>
                      )}
                      {item.last_restocked_at && (
                        <>
                          <Separator />
                          <TimelineItem
                            icon={
                              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-500" />
                            }
                            label={t("itemDetails.lastRestocked")}
                            value={format(
                              new Date(item.last_restocked_at),
                              "PPp",
                            )}
                            isRTL={isRTL}
                          />
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Helper Components
interface DetailFieldProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

function DetailField({ label, value, icon }: DetailFieldProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground flex items-center gap-2 shrink-0">
        {icon}
        {label}
      </p>
      <p className="font-medium text-sm text-right">{value}</p>
    </div>
  );
}

interface TimelineItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  isRTL?: boolean;
}

function TimelineItem({ icon, label, value, isRTL }: TimelineItemProps) {
  if (isRTL) {
    return (
      <div
        className="flex items-start gap-3"
        style={{ flexDirection: "row-reverse" }}
      >
        <div className="p-2 rounded-lg bg-muted">{icon}</div>
        <div className="flex-1 space-y-1 text-right">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-medium">{value}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-muted">{icon}</div>
      <div className="flex-1 space-y-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
