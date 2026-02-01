import { useMemo, useState } from "react";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Plus, Package, CheckCircle2, Clock } from "lucide-react";
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
  useOpeningBalances,
  useOpeningBalanceStatistics,
  useCreateOpeningBalance,
  useUpdateOpeningBalance,
  useDeleteOpeningBalance,
  useVerifyOpeningBalance,
  useRejectOpeningBalance,
  useAuth,
} from "@/hooks";
import type {
  OpeningBalanceResponse,
  CreateOpeningBalance,
  UpdateOpeningBalance,
} from "@/api/opening-balance.api";
import {
  OpeningBalanceForm,
  OpeningBalanceDetailsDialog,
  OpeningBalanceFilters,
  VerificationDialog,
  useOpeningBalanceColumns,
} from "./-components";

// Generic components
import { DataTable } from "@/components/data-display";
import { EmptyState } from "@/components/feedback";
import { ConfirmationDialog } from "@/components/feedback";
import { StatsGrid, type StatItem } from "@/components/data-display";

export const Route = createLazyFileRoute("/inventory/opening-balances/")({
  component: OpeningBalancesComponent,
});

function OpeningBalancesComponent() {
  const { t } = useTranslation("opening-balances");
  const { isRTL } = useDirection();
  const { user } = useAuth();

  // Fetch data
  const { data: balancesData, isLoading } = useOpeningBalances();
  const balances = balancesData?.items || [];
  const { data: stats } = useOpeningBalanceStatistics();

  const createBalance = useCreateOpeningBalance();
  const updateBalance = useUpdateOpeningBalance();
  const deleteBalance = useDeleteOpeningBalance();
  const verifyBalance = useVerifyOpeningBalance();
  const rejectBalance = useRejectOpeningBalance();

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [verificationFilter, setVerificationFilter] = useState<
    "all" | "verified" | "pending" | null
  >(null);
  const [entryTypeFilter, setEntryTypeFilter] = useState<
    "all" | "initial" | "adjustment" | "correction" | "reconciliation" | null
  >(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedBalance, setSelectedBalance] =
    useState<OpeningBalanceResponse | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [balanceToDelete, setBalanceToDelete] =
    useState<OpeningBalanceResponse | null>(null);

  // Handlers
  const handleOpenCreateForm = () => {
    setSelectedBalance(null);
    setFormMode("create");
    setIsFormOpen(true);
  };

  const handleEdit = (balance: OpeningBalanceResponse) => {
    setSelectedBalance(balance);
    setFormMode("edit");
    setIsFormOpen(true);
  };

  const handleFormSubmit = (
    data: CreateOpeningBalance | UpdateOpeningBalance,
  ) => {
    if (formMode === "create" && user) {
      createBalance.mutate({
        data: data as CreateOpeningBalance,
        entered_by: user.id,
      });
    } else if (selectedBalance) {
      updateBalance.mutate({
        id: selectedBalance.id,
        data: data as UpdateOpeningBalance,
      });
    }
    setIsFormOpen(false);
  };

  const handleDelete = (balance: OpeningBalanceResponse) => {
    setBalanceToDelete(balance);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (balanceToDelete) {
      deleteBalance.mutate({
        id: balanceToDelete.id,
        reason: "Deleted by user",
      });
      setIsDeleteDialogOpen(false);
      setBalanceToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setBalanceToDelete(null);
  };

  const handleViewDetails = (balance: OpeningBalanceResponse) => {
    setSelectedBalance(balance);
    setIsDetailsOpen(true);
  };

  const handleOpenVerification = (balance: OpeningBalanceResponse) => {
    setSelectedBalance(balance);
    setIsVerificationOpen(true);
  };

  const handleVerify = () => {
    if (selectedBalance && user) {
      verifyBalance.mutate({
        id: selectedBalance.id,
        verified_by: user.id,
      });
      setIsVerificationOpen(false);
      setSelectedBalance(null);
    }
  };

  const handleReject = (reason: string) => {
    if (selectedBalance) {
      rejectBalance.mutate({
        id: selectedBalance.id,
        reason,
      });
      setIsVerificationOpen(false);
      setSelectedBalance(null);
    }
  };

  const clearFilters = () => {
    setVerificationFilter(null);
    setEntryTypeFilter(null);
  };

  // Filter balances
  const filteredBalances = useMemo(() => {
    return balances.filter((balance) => {
      const matchesSearch =
        !searchQuery ||
        balance.inventory_item_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        balance.batch_number?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesVerification =
        !verificationFilter ||
        verificationFilter === "all" ||
        (verificationFilter === "verified" && balance.is_verified) ||
        (verificationFilter === "pending" && !balance.is_verified);

      const matchesEntryType =
        !entryTypeFilter ||
        entryTypeFilter === "all" ||
        balance.entry_type === entryTypeFilter;

      return matchesSearch && matchesVerification && matchesEntryType;
    });
  }, [balances, searchQuery, verificationFilter, entryTypeFilter]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (verificationFilter && verificationFilter !== "all") count++;
    if (entryTypeFilter && entryTypeFilter !== "all") count++;
    return count;
  }, [verificationFilter, entryTypeFilter]);

  // Check if filters are active
  const hasActiveFilters = Boolean(
    searchQuery ||
    (verificationFilter && verificationFilter !== "all") ||
    (entryTypeFilter && entryTypeFilter !== "all"),
  );

  // Prepare stats for StatsGrid
  const statsItems: StatItem[] = useMemo(() => {
    if (!stats) return [];
    return [
      {
        title: t("stats.totalEntries"),
        value: stats.total_entries,
        icon: Package,
        color: "bg-blue-500",
      },
      {
        title: t("stats.verified"),
        value: stats.verified_entries,
        icon: CheckCircle2,
        color: "bg-green-500",
      },
      {
        title: t("stats.pending"),
        value: stats.pending_verification,
        icon: Clock,
        color: "bg-yellow-500",
      },
      {
        title: t("stats.totalValue"),
        value: `$${stats.total_value.toFixed(2)}`,
        icon: Package,
        color: "bg-purple-500",
      },
    ];
  }, [stats, t]);

  // Table columns
  const columns = useOpeningBalanceColumns({
    t,
    isRTL,
    onViewDetails: handleViewDetails,
    onEdit: handleEdit,
    onVerify: handleOpenVerification,
    onDelete: handleDelete,
  });

  // Loading state
  if (isLoading) {
    return <Loading icon={Package} message={t("page.loadingEntries")} />;
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
            size="default"
            className="gap-2"
            onClick={handleOpenCreateForm}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("page.addEntry")}</span>
          </Button>
        </PageHeaderActions>
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
          {balances.length > 0 && (
            <OpeningBalanceFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              verificationFilter={verificationFilter}
              onVerificationFilterChange={setVerificationFilter}
              entryTypeFilter={entryTypeFilter}
              onEntryTypeFilterChange={setEntryTypeFilter}
              activeFiltersCount={activeFiltersCount}
              onClearFilters={clearFilters}
              totalItems={balances.length}
              filteredItemsCount={filteredBalances.length}
            />
          )}

          {/* Items Display */}
          <div className="flex-1 min-h-0">
            {filteredBalances.length === 0 ? (
              <EmptyState
                icon={Package}
                title={
                  hasActiveFilters
                    ? t("page.noEntriesFound")
                    : t("page.noEntries")
                }
                description={
                  hasActiveFilters
                    ? t("page.tryDifferentSearch")
                    : t("page.startAdding")
                }
                action={
                  !hasActiveFilters
                    ? {
                        label: t("page.addEntry"),
                        onClick: handleOpenCreateForm,
                        icon: Plus,
                      }
                    : undefined
                }
              />
            ) : (
              <DataTable
                data={filteredBalances}
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
            )}
          </div>
        </PageContentInner>
      </PageContent>

      {/* Dialogs */}
      <OpeningBalanceForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        mode={formMode}
        entry={selectedBalance}
      />

      <OpeningBalanceDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        entry={selectedBalance}
      />

      <VerificationDialog
        open={isVerificationOpen}
        onOpenChange={setIsVerificationOpen}
        entry={selectedBalance}
        onVerify={handleVerify}
        onReject={handleReject}
      />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={t("messages.confirmDelete")}
        description={t("messages.deleteDescription")}
        confirmLabel={t("messages.delete")}
        cancelLabel={t("messages.cancel")}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        variant="destructive"
      />
    </Page>
  );
}
