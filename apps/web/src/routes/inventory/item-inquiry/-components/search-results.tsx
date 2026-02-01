import { useMemo } from "react";
import {
  Package,
  Eye,
  TrendingUp,
  DollarSign,
  Building2,
  Barcode as BarcodeIcon,
} from "lucide-react";
import { useTranslation, useDirection } from "@meditrack/i18n";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/feedback";
import { cn } from "@/lib/utils";
import type { InventoryItemWithStockResponse } from "@/api/inventory.api";

interface SearchResultsProps {
  items: InventoryItemWithStockResponse[];
  searchQuery: string;
  searchType: "name" | "barcode" | "generic";
  onViewDetails: (item: InventoryItemWithStockResponse) => void;
  onViewStockHistory: (item: InventoryItemWithStockResponse) => void;
  onViewPriceHistory: (item: InventoryItemWithStockResponse) => void;
}

export function SearchResults({
  items,
  searchQuery,
  searchType,
  onViewDetails,
  onViewStockHistory,
  onViewPriceHistory,
}: SearchResultsProps) {
  const { t } = useTranslation("item-inquiry");
  const { isRTL } = useDirection();

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase().trim();

    return items.filter((item) => {
      switch (searchType) {
        case "name":
          return item.name.toLowerCase().includes(query);
        case "barcode":
          return item.barcodes.some((b) =>
            b.barcode.toLowerCase().includes(query),
          );
        case "generic":
          return item.generic_name?.toLowerCase().includes(query) || false;
        default:
          return false;
      }
    });
  }, [items, searchQuery, searchType]);

  const getStockStatus = (quantity: number, minLevel: number) => {
    if (quantity === 0) return "out_of_stock";
    if (quantity <= minLevel) return "low_stock";
    return "in_stock";
  };

  const getStockBadge = (quantity: number, minLevel: number) => {
    const status = getStockStatus(quantity, minLevel);

    if (status === "out_of_stock") {
      return (
        <Badge variant="destructive" className="shrink-0">
          {t("searchResults.outOfStock")}
        </Badge>
      );
    }

    if (status === "low_stock") {
      return (
        <Badge
          variant="secondary"
          className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 shrink-0"
        >
          {t("searchResults.lowStock")}
        </Badge>
      );
    }

    return (
      <Badge
        variant="secondary"
        className="bg-green-500/10 text-green-700 dark:text-green-400 shrink-0"
      >
        {t("searchResults.inStock")}
      </Badge>
    );
  };

  if (!searchQuery.trim()) {
    return (
      <EmptyState
        icon={Package}
        title={t("searchResults.noSearchYet")}
        description={t("searchResults.startSearching")}
      />
    );
  }

  if (filteredItems.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title={t("searchResults.noResults")}
        description={t("searchResults.tryDifferent")}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Results Header */}
      <div
        className={cn(
          "flex items-center justify-between",
          isRTL && "flex-row-reverse",
        )}
      >
        <h3 className="text-lg font-semibold">
          {t("searchResults.found", { count: filteredItems.length })}
        </h3>
      </div>

      {/* Results List */}
      <ScrollArea className="h-[calc(100vh-28rem)]">
        <div className="space-y-3 pr-4">
          {filteredItems.map((item) => {
            const unitPrice =
              typeof item.unit_price === "string"
                ? parseFloat(item.unit_price)
                : item.unit_price;
            const totalValue = item.stock_quantity * unitPrice;
            const primaryBarcode =
              item.barcodes.find((b) => b.is_primary)?.barcode ||
              item.barcodes[0]?.barcode;

            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div
                    className={cn(
                      "flex items-start justify-between gap-4",
                      isRTL && "flex-row-reverse",
                    )}
                  >
                    <div
                      className={cn("flex-1 min-w-0", isRTL && "text-right")}
                    >
                      <CardTitle className="text-lg mb-1">
                        {item.name}
                      </CardTitle>
                      {item.generic_name && (
                        <p className="text-sm text-muted-foreground">
                          {item.generic_name}
                        </p>
                      )}
                    </div>
                    {getStockBadge(item.stock_quantity, item.min_stock_level)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Item Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={cn("space-y-1", isRTL && "text-right")}>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {t("searchResults.stock")}
                      </p>
                      <p className="text-sm font-semibold">
                        {item.stock_quantity} {t("searchResults.units")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("searchResults.min")}: {item.min_stock_level}
                      </p>
                    </div>

                    <div className={cn("space-y-1", isRTL && "text-right")}>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {t("searchResults.price")}
                      </p>
                      <p className="text-sm font-semibold text-green-600">
                        ${unitPrice.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("searchResults.total")}: ${totalValue.toFixed(2)}
                      </p>
                    </div>

                    <div className={cn("space-y-1", isRTL && "text-right")}>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {t("searchResults.manufacturer")}
                      </p>
                      <p className="text-sm font-semibold truncate">
                        {item.manufacturer_name || t("searchResults.na")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.form}
                      </p>
                    </div>

                    <div className={cn("space-y-1", isRTL && "text-right")}>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <BarcodeIcon className="h-3 w-3" />
                        {t("searchResults.barcode")}
                      </p>
                      <p className="text-sm font-semibold font-mono">
                        {primaryBarcode || t("searchResults.na")}
                      </p>
                      {item.concentration && (
                        <p className="text-xs text-muted-foreground">
                          {item.concentration}
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Action Buttons */}
                  <div
                    className={cn(
                      "flex flex-wrap gap-2",
                      isRTL && "flex-row-reverse",
                    )}
                  >
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onViewDetails(item)}
                      className={cn("gap-2", isRTL && "flex-row-reverse")}
                    >
                      <Eye className="h-4 w-4" />
                      {t("searchResults.viewDetails")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewStockHistory(item)}
                      className={cn("gap-2", isRTL && "flex-row-reverse")}
                    >
                      <TrendingUp className="h-4 w-4" />
                      {t("searchResults.stockHistory")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewPriceHistory(item)}
                      className={cn("gap-2", isRTL && "flex-row-reverse")}
                    >
                      <DollarSign className="h-4 w-4" />
                      {t("searchResults.priceHistory")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
