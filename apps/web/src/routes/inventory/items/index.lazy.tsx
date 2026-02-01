import { useMemo, useState } from "react";
import { createLazyFileRoute } from "@tanstack/react-router";
import {
  Plus,
  Package,
  LayoutGrid,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { useDirection, useTranslation } from "@meditrack/i18n";
import type { SortingState } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import {
  Page,
  PageHeader,
  PageHeaderTrigger,
  PageHeaderContent,
  PageHeaderTitle,
  PageHeaderDescription,
  PageHeaderActions,
  PageContent,
  PageContentInner,
} from "@/components/ui/page";
import {
  useInventoryItems,
  useInventoryStatistics,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useAdjustInventoryStock,
  useDeleteInventoryItem,
  usePriceHistory,
  useSettingValue,
  useUpsertSettingValue,
} from "@/hooks";
import { SETTING_INVENTORY_VIEW_MODE } from "@/lib/constants";
import type {
  InventoryItemWithStockResponse,
  CreateInventoryItemWithStock,
} from "@/api/inventory.api";
import {
  InventoryForm,
  StockAdjustmentDialog,
  StockHistoryDialog,
  ItemDetailsDialog,
  InventoryFilters,
  InventoryGrid,
  useInventoryColumns,
  getStockStatus,
} from "./-components";

// Generic components
import { DataTable } from "@/components/data-display";
import { EmptyState } from "@/components/feedback";
import { ConfirmationDialog } from "@/components/feedback";
import { StatsGrid, type StatItem } from "@/components/data-display";

export const Route = createLazyFileRoute("/inventory/items/")({
  component: InventoryComponent,
});

function InventoryComponent() {
  const { t } = useTranslation("inventory");
  const { isRTL } = useDirection();

  // Fetch data
  const { data: items = [], isLoading } = useInventoryItems();
  const { data: stats } = useInventoryStatistics();
  const createInventoryItem = useCreateInventoryItem();
  const updateInventoryItem = useUpdateInventoryItem();
  const adjustStock = useAdjustInventoryStock();
  const deleteItem = useDeleteInventoryItem();

  // View mode setting
  const viewMode = useSettingValue<"table" | "grid">(
    SETTING_INVENTORY_VIEW_MODE,
    "table",
  );
  const upsertViewMode = useUpsertSettingValue();

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [formFilter, setFormFilter] = useState<string | "all" | null>(null);
  const [stockFilter, setStockFilter] = useState<
    "all" | "in_stock" | "low_stock" | "out_of_stock" | null
  >(null);
  const [prescriptionFilter, setPrescriptionFilter] = useState<
    "all" | "prescription" | "otc" | null
  >(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit" | "duplicate">(
    "create",
  );
  const [selectedItem, setSelectedItem] =
    useState<InventoryItemWithStockResponse | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isStockAdjustOpen, setIsStockAdjustOpen] = useState(false);
  const [isStockHistoryOpen, setIsStockHistoryOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] =
    useState<InventoryItemWithStockResponse | null>(null);

  // Handlers
  const handleOpenCreateForm = () => {
    setSelectedItem(null);
    setFormMode("create");
    setIsFormOpen(true);
  };

  const handleEdit = (item: InventoryItemWithStockResponse) => {
    setSelectedItem(item);
    setFormMode("edit");
    setIsFormOpen(true);
  };

  const handleDuplicate = (item: InventoryItemWithStockResponse) => {
    setSelectedItem(item);
    setFormMode("duplicate");
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: CreateInventoryItemWithStock) => {
    if (formMode === "create" || formMode === "duplicate") {
      createInventoryItem.mutate(data);
    } else if (selectedItem) {
      // For edit mode, we need to update both catalog and stock
      updateInventoryItem.mutate({
        id: selectedItem.id,
        data: {
          name: data.name,
          generic_name: data.generic_name,
          concentration: data.concentration,
          form: data.form,
          manufacturer_id: data.manufacturer_id,
          requires_prescription: data.requires_prescription,
          is_controlled: data.is_controlled,
          storage_instructions: data.storage_instructions,
          notes: data.notes,
        },
      });
      // Note: Stock updates should be done via stock adjustment dialog
      // to maintain proper audit trail
    }
    setIsFormOpen(false);
  };

  const handleStockAdjust = (
    itemId: string,
    adjustment: number,
    reason?: string,
    adjustmentType?: string,
  ) => {
    adjustStock.mutate({
      id: itemId,
      data: { adjustment, reason, adjustment_type: adjustmentType },
    });
    setIsStockAdjustOpen(false);
    setSelectedItem(null);
  };

  const handleDelete = (item: InventoryItemWithStockResponse) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteItem.mutate(itemToDelete.id);
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleViewDetails = (item: InventoryItemWithStockResponse) => {
    setSelectedItem(item);
    setIsDetailsOpen(true);
  };

  const handleOpenStockAdjust = (item: InventoryItemWithStockResponse) => {
    setSelectedItem(item);
    setIsStockAdjustOpen(true);
  };

  const handleViewStockHistory = (item: InventoryItemWithStockResponse) => {
    setSelectedItem(item);
    setIsStockHistoryOpen(true);
  };

  const toggleViewMode = () => {
    const newMode = viewMode === "table" ? "grid" : "table";
    upsertViewMode.mutate({
      key: SETTING_INVENTORY_VIEW_MODE,
      value: newMode,
    });
  };

  const clearFilters = () => {
    setFormFilter(null);
    setStockFilter(null);
    setPrescriptionFilter(null);
  };

  // Fetch price history for selected item
  const { data: priceHistory = [] } = usePriceHistory(
    selectedItem?.id ?? "",
    12,
    { enabled: !!selectedItem },
  );

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.generic_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.barcodes.some((b) =>
          b.barcode.toLowerCase().includes(searchQuery.toLowerCase()),
        );

      const matchesForm =
        !formFilter || formFilter === "all" || item.form === formFilter;

      const stockStatus = getStockStatus(
        item.stock_quantity,
        item.min_stock_level,
      );
      const matchesStock =
        !stockFilter || stockFilter === "all" || stockStatus === stockFilter;

      const matchesPrescription =
        !prescriptionFilter ||
        prescriptionFilter === "all" ||
        (prescriptionFilter === "prescription" && item.requires_prescription) ||
        (prescriptionFilter === "otc" && !item.requires_prescription);

      return (
        matchesSearch && matchesForm && matchesStock && matchesPrescription
      );
    });
  }, [items, searchQuery, formFilter, stockFilter, prescriptionFilter]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (formFilter && formFilter !== "all") count++;
    if (stockFilter && stockFilter !== "all") count++;
    if (prescriptionFilter && prescriptionFilter !== "all") count++;
    return count;
  }, [formFilter, stockFilter, prescriptionFilter]);

  // Check if filters are active
  const hasActiveFilters = Boolean(
    searchQuery ||
    (formFilter && formFilter !== "all") ||
    (stockFilter && stockFilter !== "all") ||
    (prescriptionFilter && prescriptionFilter !== "all"),
  );

  // Prepare stats for StatsGrid
  const statsItems: StatItem[] = useMemo(() => {
    if (!stats) return [];
    return [
      {
        title: t("stats.totalItems"),
        value: stats.total_items,
        icon: Package,
        color: "bg-blue-500",
      },
      {
        title: t("stats.inStock"),
        value: stats.active_items,
        icon: Package,
        color: "bg-green-500",
      },
      {
        title: t("stats.lowStock"),
        value: stats.low_stock_count,
        icon: AlertTriangle,
        color: "bg-yellow-500",
      },
      {
        title: t("stats.outOfStock"),
        value: stats.out_of_stock_count,
        icon: XCircle,
        color: "bg-red-500",
      },
      {
        title: t("stats.totalValue"),
        value: `${stats.total_inventory_value.toFixed(2)}`,
        icon: Package,
        color: "bg-purple-500",
      },
    ];
  }, [stats, t]);

  // Table columns
  const columns = useInventoryColumns({
    t,
    isRTL,
    onViewDetails: handleViewDetails,
    onEdit: handleEdit,
    onDuplicate: handleDuplicate,
    onAdjustStock: handleOpenStockAdjust,
    onViewStockHistory: handleViewStockHistory,
    onDelete: handleDelete,
  });

  // Loading state
  if (isLoading) {
    return <Loading icon={Package} message="Loading inventory..." />;
  }

  return (
    <Page>
      <PageHeader>
        <PageHeaderTrigger />
        <PageHeaderContent>
          <PageHeaderTitle>{t("page.title")}</PageHeaderTitle>
          <PageHeaderDescription>{t("page.description")}</PageHeaderDescription>
        </PageHeaderContent>
        <PageHeaderActions className="flex gap-2">
          <Button
            onClick={toggleViewMode}
            variant="outline"
            size="default"
            className="gap-2"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">
              {viewMode === "table" ? t("page.gridView") : t("page.tableView")}
            </span>
          </Button>

          <Button
            size="default"
            className="gap-2"
            onClick={handleOpenCreateForm}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("page.addItem")}</span>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <PageContent>
        <PageContentInner className="flex-1 flex flex-col min-h-0">
          {/* Statistics - Using Generic StatsGrid */}
          {statsItems.length > 0 && (
            <StatsGrid
              stats={statsItems}
              columns={{ default: 2, md: 3, lg: 5 }}
            />
          )}

          {/* Filters */}
          {items.length > 0 && (
            <InventoryFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              formFilter={formFilter}
              onFormFilterChange={setFormFilter}
              stockFilter={stockFilter}
              onStockFilterChange={setStockFilter}
              prescriptionFilter={prescriptionFilter}
              onPrescriptionFilterChange={setPrescriptionFilter}
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
                  hasActiveFilters ? t("page.noItemsFound") : t("page.noItems")
                }
                description={
                  hasActiveFilters
                    ? t("page.tryDifferentSearch")
                    : t("page.startAdding")
                }
                action={
                  !hasActiveFilters
                    ? {
                        label: t("page.addItem"),
                        onClick: handleOpenCreateForm,
                        icon: Plus,
                      }
                    : undefined
                }
              />
            ) : viewMode === "table" ? (
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
                  previous: "Previous",
                  next: "Next",
                  firstPage: "First page",
                  lastPage: "Last page",
                  previousPage: "Previous page",
                  nextPage: "Next page",
                }}
              />
            ) : (
              <InventoryGrid
                items={filteredItems}
                onViewDetails={handleViewDetails}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onAdjustStock={handleOpenStockAdjust}
                onViewStockHistory={handleViewStockHistory}
                onDelete={handleDelete}
              />
            )}
          </div>
        </PageContentInner>
      </PageContent>

      {/* Dialogs */}
      <InventoryForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        mode={formMode}
        item={selectedItem}
      />

      <ItemDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        item={selectedItem}
        priceHistory={priceHistory}
      />

      <StockAdjustmentDialog
        open={isStockAdjustOpen}
        onOpenChange={setIsStockAdjustOpen}
        item={selectedItem}
        onAdjust={handleStockAdjust}
      />

      <StockHistoryDialog
        open={isStockHistoryOpen}
        onOpenChange={setIsStockHistoryOpen}
        item={selectedItem}
      />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={t("messages.confirmDelete", { name: itemToDelete?.name || "" })}
        description={t("messages.deleteDescription")}
        confirmLabel={t("messages.archive")}
        cancelLabel={t("messages.cancel")}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        variant="destructive"
      />
    </Page>
  );
}
