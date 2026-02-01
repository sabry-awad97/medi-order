import { useState, useMemo } from "react";
import { createLazyFileRoute } from "@tanstack/react-router";
import {
  Search,
  Package,
  AlertTriangle,
  XCircle,
  Clock,
  DollarSign,
} from "lucide-react";
import { useDirection, useTranslation } from "@meditrack/i18n";

import { Loading } from "@/components/ui/loading";
import {
  Page,
  PageHeader,
  PageHeaderTrigger,
  PageHeaderContent,
  PageHeaderTitle,
  PageHeaderDescription,
  PageContent,
  PageContentInner,
} from "@/components/ui/page";
import { useInventoryItems, usePriceHistory } from "@/hooks";
import type { InventoryItemWithStockResponse } from "@/api/inventory.api";
import {
  ItemDetailsDialog,
  StockHistoryDialog,
  PriceHistoryDialog,
} from "@/routes/inventory/items/-components";
import { SearchPanel, SearchResults } from "./-components";
import { StatsGrid, type StatItem } from "@/components/data-display";

export const Route = createLazyFileRoute("/inventory/item-inquiry/")({
  component: ItemInquiryComponent,
});

function ItemInquiryComponent() {
  const { t } = useTranslation("item-inquiry");
  const { isRTL } = useDirection();

  // Fetch data
  const { data: items = [], isLoading } = useInventoryItems();

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"name" | "barcode" | "generic">(
    "name",
  );
  const [selectedItem, setSelectedItem] =
    useState<InventoryItemWithStockResponse | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isStockHistoryOpen, setIsStockHistoryOpen] = useState(false);
  const [isPriceHistoryOpen, setIsPriceHistoryOpen] = useState(false);

  // Handlers
  const handleSearch = (
    query: string,
    type: "name" | "barcode" | "generic",
  ) => {
    setSearchQuery(query);
    setSearchType(type);
  };

  const handleViewDetails = (item: InventoryItemWithStockResponse) => {
    setSelectedItem(item);
    setIsDetailsOpen(true);
  };

  const handleViewStockHistory = (item: InventoryItemWithStockResponse) => {
    setSelectedItem(item);
    setIsStockHistoryOpen(true);
  };

  const handleViewPriceHistory = (item: InventoryItemWithStockResponse) => {
    setSelectedItem(item);
    setIsPriceHistoryOpen(true);
  };

  // Calculate statistics
  const statsItems: StatItem[] = useMemo(() => {
    const lowStock = items.filter(
      (item) =>
        item.stock_quantity > 0 && item.stock_quantity <= item.min_stock_level,
    ).length;
    const outOfStock = items.filter((item) => item.stock_quantity === 0).length;

    // Calculate high value items (top 20% by total value)
    const itemsWithValue = items.map((item) => ({
      ...item,
      totalValue:
        item.stock_quantity *
        (typeof item.unit_price === "string"
          ? parseFloat(item.unit_price)
          : item.unit_price),
    }));
    const sortedByValue = [...itemsWithValue].sort(
      (a, b) => b.totalValue - a.totalValue,
    );
    const highValueCount = Math.ceil(sortedByValue.length * 0.2);

    return [
      {
        title: t("stats.totalItems"),
        value: items.length,
        icon: Package,
        color: "bg-blue-500",
      },
      {
        title: t("stats.lowStock"),
        value: lowStock,
        icon: AlertTriangle,
        color: "bg-yellow-500",
      },
      {
        title: t("stats.outOfStock"),
        value: outOfStock,
        icon: XCircle,
        color: "bg-red-500",
      },
      {
        title: t("stats.expiringSoon"),
        value: 0, // Placeholder
        icon: Clock,
        color: "bg-orange-500",
      },
      {
        title: t("stats.highValue"),
        value: highValueCount,
        icon: DollarSign,
        color: "bg-green-500",
      },
    ];
  }, [items, t]);

  // Fetch price history for selected item
  const { data: priceHistory = [] } = usePriceHistory(
    selectedItem?.id ?? "",
    12,
    { enabled: !!selectedItem },
  );

  // Loading state
  if (isLoading) {
    return <Loading icon={Search} message={t("loading")} />;
  }

  return (
    <Page>
      <PageHeader>
        <PageHeaderTrigger />
        <PageHeaderContent>
          <PageHeaderTitle>{t("title")}</PageHeaderTitle>
          <PageHeaderDescription>{t("description")}</PageHeaderDescription>
        </PageHeaderContent>
      </PageHeader>

      <PageContent>
        <PageContentInner className="flex-1 flex flex-col min-h-0">
          {/* Statistics */}
          {statsItems.length > 0 && (
            <StatsGrid
              stats={statsItems}
              columns={{ default: 2, md: 3, lg: 5 }}
            />
          )}

          {/* Search Panel */}
          <SearchPanel
            onSearch={handleSearch}
            searchQuery={searchQuery}
            searchType={searchType}
          />

          {/* Search Results */}
          <div className="flex-1 min-h-0">
            <SearchResults
              items={items}
              searchQuery={searchQuery}
              searchType={searchType}
              onViewDetails={handleViewDetails}
              onViewStockHistory={handleViewStockHistory}
              onViewPriceHistory={handleViewPriceHistory}
            />
          </div>
        </PageContentInner>
      </PageContent>

      {/* Dialogs */}
      <ItemDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        item={selectedItem}
        priceHistory={priceHistory}
      />

      <StockHistoryDialog
        open={isStockHistoryOpen}
        onOpenChange={setIsStockHistoryOpen}
        item={selectedItem}
      />

      <PriceHistoryDialog
        open={isPriceHistoryOpen}
        onOpenChange={setIsPriceHistoryOpen}
        item={selectedItem}
        priceHistory={priceHistory}
      />
    </Page>
  );
}
