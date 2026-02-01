import { useMemo, useState } from "react";
import { createLazyFileRoute } from "@tanstack/react-router";
import { TrendingDown, Package, History } from "lucide-react";
import { useDirection, useTranslation } from "@meditrack/i18n";
import type { SortingState } from "@tanstack/react-table";
import { toast } from "sonner";

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
import {
  useInventoryItems,
  useAdjustInventoryStock,
  useUpdateInventoryStock,
  usePriceHistory,
} from "@/hooks";
import type { InventoryItemWithStockResponse } from "@/api/inventory.api";
import {
  StockAdjustmentDialog,
  ItemDetailsDialog,
  StockHistoryDialog,
  UpdateMinLevelDialog,
  PriceHistoryDialog,
  QuickOrderDialog,
} from "@/routes/inventory/items/-components";
import {
  useStockAdjustmentColumns,
  StockAdjustmentFilters,
} from "./-components";

// Generic components
import { DataTable } from "@/components/data-display";
import { EmptyState } from "@/components/feedback";
import { StatsGrid, type StatItem } from "@/components/data-display";

export const Route = createLazyFileRoute("/inventory/stock-adjustments/")({
  component: StockAdjustmentsComponent,
});

function StockAdjustmentsComponent() {
  const { t } = useTranslation("stock-adjustments");
  const { isRTL } = useDirection();

  // Fetch data
  const { data: items = [], isLoading } = useInventoryItems();
  const adjustStock = useAdjustInventoryStock();
  const updateStock = useUpdateInventoryStock();

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<
    "all" | "in_stock" | "low_stock" | "out_of_stock" | null
  >(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isStockHistoryOpen, setIsStockHistoryOpen] = useState(false);
  const [isPriceHistoryOpen, setIsPriceHistoryOpen] = useState(false);
  const [isMinLevelDialogOpen, setIsMinLevelDialogOpen] = useState(false);
  const [isQuickOrderOpen, setIsQuickOrderOpen] = useState(false);
  const [selectedItem, setSelectedItem] =
    useState<InventoryItemWithStockResponse | null>(null);

  // Handlers
  const handleOpenAdjustDialog = (item: InventoryItemWithStockResponse) => {
    setSelectedItem(item);
    setIsAdjustDialogOpen(true);
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

  const handleUpdateMinLevel = (item: InventoryItemWithStockResponse) => {
    setSelectedItem(item);
    setIsMinLevelDialogOpen(true);
  };

  const handleQuickReorder = (item: InventoryItemWithStockResponse) => {
    setSelectedItem(item);
    setIsQuickOrderOpen(true);
  };

  const handleStockAdjust = (
    itemId: string,
    adjustment: number,
    reason?: string,
    adjustmentType?: string,
  ) => {
    adjustStock.mutate({
      id: itemId,
      data: {
        adjustment,
        reason,
        adjustment_type: adjustmentType as
          | "manual_adjustment"
          | "order_arrival"
          | "sale"
          | "damage"
          | "expiry"
          | "return"
          | "transfer"
          | "initial_stock"
          | undefined,
      },
    });
    setIsAdjustDialogOpen(false);
    setSelectedItem(null);
  };

  const handleMinLevelUpdate = (itemId: string, minLevel: number) => {
    updateStock.mutate({
      id: itemId,
      data: {
        min_stock_level: minLevel,
      },
    });
    setIsMinLevelDialogOpen(false);
    setSelectedItem(null);
  };

  const handleQuickOrder = (
    itemId: string,
    quantity: number,
    notes?: string,
  ) => {
    // TODO: Integrate with orders module when available
    toast.info(
      `Quick purchase order will be created in the future: ${quantity} units${notes ? ` - ${notes}` : ""}`,
    );
    // For now, just close the dialog
    setIsQuickOrderOpen(false);
    setSelectedItem(null);
  };

  const clearFilters = () => {
    setStockFilter(null);
    setSearchQuery("");
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.generic_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const getStockStatus = (quantity: number, minLevel: number) => {
        if (quantity === 0) return "out_of_stock";
        if (quantity <= minLevel) return "low_stock";
        return "in_stock";
      };

      const stockStatus = getStockStatus(
        item.stock_quantity,
        item.min_stock_level,
      );
      const matchesStock =
        !stockFilter || stockFilter === "all" || stockStatus === stockFilter;

      return matchesSearch && matchesStock;
    });
  }, [items, searchQuery, stockFilter]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (stockFilter && stockFilter !== "all") count++;
    return count;
  }, [stockFilter]);

  // Check if filters are active
  const hasActiveFilters = Boolean(
    searchQuery || (stockFilter && stockFilter !== "all"),
  );

  // Calculate stats
  const statsItems: StatItem[] = useMemo(() => {
    const totalItems = items.length;
    const lowStockItems = items.filter(
      (item) =>
        item.stock_quantity > 0 && item.stock_quantity <= item.min_stock_level,
    ).length;
    const outOfStockItems = items.filter(
      (item) => item.stock_quantity === 0,
    ).length;
    const needsAttention = lowStockItems + outOfStockItems;

    return [
      {
        title: t("stats.totalItems"),
        value: totalItems,
        icon: Package,
        color: "bg-blue-500",
      },
      {
        title: t("stats.lowStock"),
        value: lowStockItems,
        icon: TrendingDown,
        color: "bg-yellow-500",
      },
      {
        title: t("stats.outOfStock"),
        value: outOfStockItems,
        icon: Package,
        color: "bg-red-500",
      },
      {
        title: t("stats.needsAttention"),
        value: needsAttention,
        icon: History,
        color: "bg-orange-500",
      },
    ];
  }, [items, t]);

  // Fetch price history for selected item
  const { data: priceHistory = [] } = usePriceHistory(
    selectedItem?.id ?? "",
    12,
    { enabled: !!selectedItem },
  );

  // Table columns
  const columns = useStockAdjustmentColumns({
    t,
    isRTL,
    onAdjust: handleOpenAdjustDialog,
    onViewDetails: handleViewDetails,
    onViewStockHistory: handleViewStockHistory,
    onViewPriceHistory: handleViewPriceHistory,
    onUpdateMinLevel: handleUpdateMinLevel,
    onQuickReorder: handleQuickReorder,
  });

  // Loading state
  if (isLoading) {
    return <Loading icon={Package} message={t("loading")} />;
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
              columns={{ default: 2, md: 2, lg: 4 }}
            />
          )}

          {/* Filters */}
          {items.length > 0 && (
            <StockAdjustmentFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              stockFilter={stockFilter}
              onStockFilterChange={setStockFilter}
              activeFiltersCount={activeFiltersCount}
              onClearFilters={clearFilters}
              totalItems={items.length}
              filteredItemsCount={filteredItems.length}
            />
          )}

          {/* Items Display */}
          <div className="flex-1 min-h-0">
            {filteredItems.length === 0 ? (
              <EmptyState
                icon={Package}
                title={
                  hasActiveFilters ? t("noItemsFound") : t("noItemsAvailable")
                }
                description={
                  hasActiveFilters
                    ? t("tryDifferentSearch")
                    : t("addInventoryItems")
                }
              />
            ) : (
              <DataTable
                data={filteredItems}
                columns={columns}
                sorting={sorting}
                onSortingChange={setSorting}
                pageSize={20}
                pageSizeOptions={[10, 20, 30, 50, 100]}
                paginationLabels={{
                  showing: t("pagination.showing"),
                  to: t("pagination.to"),
                  of: t("pagination.of"),
                  items: t("pagination.items"),
                  rowsPerPage: t("pagination.rowsPerPage"),
                  previous: t("pagination.previous"),
                  next: t("pagination.next"),
                  firstPage: t("pagination.firstPage"),
                  lastPage: t("pagination.lastPage"),
                  previousPage: t("pagination.previousPage"),
                  nextPage: t("pagination.nextPage"),
                }}
              />
            )}
          </div>
        </PageContentInner>
      </PageContent>

      {/* Dialogs */}
      <StockAdjustmentDialog
        open={isAdjustDialogOpen}
        onOpenChange={setIsAdjustDialogOpen}
        item={selectedItem}
        onAdjust={handleStockAdjust}
      />

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

      <UpdateMinLevelDialog
        open={isMinLevelDialogOpen}
        onOpenChange={setIsMinLevelDialogOpen}
        item={selectedItem}
        onUpdate={handleMinLevelUpdate}
      />

      <PriceHistoryDialog
        open={isPriceHistoryOpen}
        onOpenChange={setIsPriceHistoryOpen}
        item={selectedItem}
        priceHistory={priceHistory}
      />

      <QuickOrderDialog
        open={isQuickOrderOpen}
        onOpenChange={setIsQuickOrderOpen}
        item={selectedItem}
        onOrder={handleQuickOrder}
      />
    </Page>
  );
}
