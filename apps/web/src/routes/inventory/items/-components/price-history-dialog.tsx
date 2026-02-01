import { useTranslation, useDirection } from "@meditrack/i18n";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/feedback";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import type {
  InventoryItemWithStockResponse,
  PriceHistoryEntry,
} from "@/api/inventory.api";
import { PriceHistoryChart } from "./price-history-chart";

interface PriceHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItemWithStockResponse | null;
  priceHistory: PriceHistoryEntry[];
  isLoading?: boolean;
}

export function PriceHistoryDialog({
  open,
  onOpenChange,
  item,
  priceHistory = [],
  isLoading = false,
}: PriceHistoryDialogProps) {
  const { t } = useTranslation("inventory");
  const { isRTL } = useDirection();

  if (!item) return null;

  const unitPrice =
    typeof item.unit_price === "string"
      ? parseFloat(item.unit_price)
      : item.unit_price;

  // Calculate statistics
  const prices = priceHistory.map((entry) =>
    typeof entry.unit_price === "string"
      ? parseFloat(entry.unit_price)
      : entry.unit_price,
  );
  const minPrice = prices.length > 0 ? Math.min(...prices) : unitPrice;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : unitPrice;
  const avgPrice =
    prices.length > 0
      ? prices.reduce((sum, price) => sum + price, 0) / prices.length
      : unitPrice;

  const priceChange =
    priceHistory.length > 1
      ? unitPrice - parseFloat(priceHistory[priceHistory.length - 1].unit_price)
      : 0;
  const priceChangePercent =
    priceHistory.length > 1
      ? (priceChange /
          parseFloat(priceHistory[priceHistory.length - 1].unit_price)) *
        100
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-3xl h-[85vh] flex flex-col p-0 gap-0"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="border-b px-6 py-4 shrink-0">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-lg">
                  {t("itemDetails.priceHistory")}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {item.name}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 h-0">
          <div className="p-6 space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-[200px]" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              </div>
            ) : priceHistory.length === 0 ? (
              <EmptyState
                icon={DollarSign}
                title={t("itemDetails.noPriceHistory")}
                description={t("itemDetails.noPriceHistory")}
              />
            ) : (
              <>
                {/* Price History Chart */}
                <PriceHistoryChart
                  data={priceHistory}
                  currentPrice={unitPrice}
                />

                {/* Statistics Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card>
                    <CardContent className="p-3">
                      <div className="text-xs text-muted-foreground">
                        {t("itemDetails.minPrice")}
                      </div>
                      <div className="text-xl font-bold text-green-600 mt-1">
                        ${minPrice.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <div className="text-xs text-muted-foreground">
                        {t("itemDetails.maxPrice")}
                      </div>
                      <div className="text-xl font-bold text-green-600 mt-1">
                        ${maxPrice.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <div className="text-xs text-muted-foreground">
                        {t("itemDetails.avgPrice")}
                      </div>
                      <div className="text-xl font-bold text-green-600 mt-1">
                        ${avgPrice.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card
                    className={
                      priceChange > 0
                        ? "bg-red-500/5"
                        : priceChange < 0
                          ? "bg-green-500/5"
                          : "bg-muted/50"
                    }
                  >
                    <CardContent className="p-3">
                      <div className="text-xs text-muted-foreground">
                        {t("itemDetails.price")} {t("itemDetails.priceChanges")}
                      </div>
                      <div
                        className={`text-xl font-bold mt-1 flex items-center gap-1 ${
                          priceChange > 0
                            ? "text-red-600"
                            : priceChange < 0
                              ? "text-green-600"
                              : "text-muted-foreground"
                        }`}
                      >
                        {priceChange > 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : priceChange < 0 ? (
                          <TrendingDown className="h-4 w-4" />
                        ) : null}
                        {priceChange > 0 ? "+" : ""}
                        {Math.abs(priceChangePercent).toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Current Price */}
                <Card className="bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          {t("itemDetails.unitPrice")}
                        </div>
                        <div className="text-3xl font-bold text-primary mt-1">
                          ${unitPrice.toFixed(2)}
                        </div>
                      </div>
                      {priceChange !== 0 && (
                        <div
                          className={`text-right ${priceChange > 0 ? "text-red-600" : "text-green-600"}`}
                        >
                          <div className="text-xs">
                            {priceChange > 0
                              ? t("itemDetails.trendingUp")
                              : t("itemDetails.trendingDown")}
                          </div>
                          <div className="text-lg font-semibold">
                            {Math.abs(priceChangePercent).toFixed(1)}%
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
