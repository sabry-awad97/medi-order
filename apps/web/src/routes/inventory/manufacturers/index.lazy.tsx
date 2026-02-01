import { useMemo, useState } from "react";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Plus, Users, Building2, MapPin, Globe } from "lucide-react";
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
  useManufacturers,
  useCreateManufacturer,
  useUpdateManufacturer,
  useDeleteManufacturer,
} from "@/hooks";
import type {
  ManufacturerResponse,
  CreateManufacturer,
  UpdateManufacturer,
} from "@/api/manufacturer.api";
import {
  useManufacturerColumns,
  ManufacturerDetailsDialog,
  ManufacturerFormDialog,
} from "./-components";

// Generic components
import { DataTable } from "@/components/data-display";
import { EmptyState } from "@/components/feedback";
import { ConfirmationDialog } from "@/components/feedback";
import { StatsGrid, type StatItem } from "@/components/data-display";

export const Route = createLazyFileRoute("/inventory/manufacturers/")({
  component: ManufacturersComponent,
});

function ManufacturersComponent() {
  const { t } = useTranslation("manufacturer");
  const { isRTL } = useDirection();

  // Local state
  const [searchQuery] = useState("");
  const [statusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [currentPage] = useState(1);
  const [pageSize] = useState(20);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedManufacturer, setSelectedManufacturer] =
    useState<ManufacturerResponse | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [manufacturerToDelete, setManufacturerToDelete] =
    useState<ManufacturerResponse | null>(null);

  // Build filters
  const filters = useMemo(() => {
    const filterObj: any = {};

    if (searchQuery) {
      filterObj.name = searchQuery;
    }

    if (statusFilter !== "all") {
      filterObj.is_active = statusFilter === "active";
    }

    return Object.keys(filterObj).length > 0 ? filterObj : undefined;
  }, [searchQuery, statusFilter]);

  // Fetch data with pagination
  const { data, isLoading } = useManufacturers(filters, {
    page: currentPage,
    page_size: pageSize,
  });

  const manufacturers = data?.items || [];

  const createManufacturer = useCreateManufacturer();
  const updateManufacturer = useUpdateManufacturer();
  const deleteManufacturer = useDeleteManufacturer();

  // Handlers
  const handleViewDetails = (manufacturer: ManufacturerResponse) => {
    setSelectedManufacturer(manufacturer);
    setIsDetailsOpen(true);
  };

  const handleOpenCreateForm = () => {
    setSelectedManufacturer(null);
    setFormMode("create");
    setIsFormOpen(true);
  };

  const handleEdit = (manufacturer: ManufacturerResponse) => {
    setSelectedManufacturer(manufacturer);
    setFormMode("edit");
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: CreateManufacturer | UpdateManufacturer) => {
    if (formMode === "create") {
      createManufacturer.mutate(data as CreateManufacturer);
    } else if (selectedManufacturer) {
      updateManufacturer.mutate({
        id: selectedManufacturer.id,
        data: data as UpdateManufacturer,
      });
    }
  };

  const handleDelete = (manufacturer: ManufacturerResponse) => {
    setManufacturerToDelete(manufacturer);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (manufacturerToDelete) {
      deleteManufacturer.mutate(manufacturerToDelete.id);
      setIsDeleteDialogOpen(false);
      setManufacturerToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setManufacturerToDelete(null);
  };

  // Calculate stats from all manufacturers (not filtered)
  const { data: allManufacturersData } = useManufacturers();
  const allManufacturers = allManufacturersData?.items || [];

  const statsItems: StatItem[] = useMemo(() => {
    const activeCount = allManufacturers.filter((m) => m.is_active).length;
    const inactiveCount = allManufacturers.length - activeCount;
    const withWebsite = allManufacturers.filter((m) => m.website).length;
    const withContact = allManufacturers.filter(
      (m) => m.email || m.phone,
    ).length;

    return [
      {
        title: t("stats.total"),
        value: allManufacturers.length,
        icon: Building2,
        color: "bg-blue-500",
      },
      {
        title: t("stats.active"),
        value: activeCount,
        icon: Users,
        color: "bg-green-500",
      },
      {
        title: t("stats.inactive"),
        value: inactiveCount,
        icon: Users,
        color: "bg-gray-500",
      },
      {
        title: t("stats.withWebsite"),
        value: withWebsite,
        icon: Globe,
        color: "bg-purple-500",
      },
      {
        title: t("stats.withContact"),
        value: withContact,
        icon: MapPin,
        color: "bg-orange-500",
      },
    ];
  }, [allManufacturers, t]);

  // Table columns
  const columns = useManufacturerColumns({
    t,
    isRTL,
    onViewDetails: handleViewDetails,
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  // Loading state
  if (isLoading) {
    return <Loading icon={Building2} message={t("loading")} />;
  }

  return (
    <Page>
      <PageHeader>
        <PageHeaderTrigger />
        <PageHeaderContent>
          <PageHeaderTitle>{t("title")}</PageHeaderTitle>
          <PageHeaderDescription>{t("description")}</PageHeaderDescription>
        </PageHeaderContent>
        <PageHeaderActions className="flex gap-2">
          <Button
            size="default"
            className="gap-2"
            onClick={handleOpenCreateForm}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("addManufacturer")}</span>
          </Button>
        </PageHeaderActions>
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

          {/* Items Display */}
          <div className="flex-1 min-h-0">
            {manufacturers.length === 0 && !isLoading ? (
              <EmptyState
                icon={Building2}
                title={
                  searchQuery || statusFilter !== "all"
                    ? t("noManufacturersFound")
                    : t("noManufacturers")
                }
                description={
                  searchQuery || statusFilter !== "all"
                    ? t("adjustFilters")
                    : t("getStarted")
                }
                action={
                  !searchQuery && statusFilter === "all"
                    ? {
                        label: t("addManufacturer"),
                        onClick: handleOpenCreateForm,
                        icon: Plus,
                      }
                    : undefined
                }
              />
            ) : (
              <DataTable
                data={manufacturers}
                columns={columns}
                sorting={sorting}
                onSortingChange={setSorting}
                pageSize={pageSize}
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
      <ManufacturerDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        manufacturer={selectedManufacturer}
      />

      <ManufacturerFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        manufacturer={selectedManufacturer}
        mode={formMode}
        onSubmit={handleFormSubmit}
      />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={t("delete.title", {
          name: manufacturerToDelete?.name || t("deleteManufacturer"),
        })}
        description={t("delete.description")}
        confirmLabel={t("delete.confirm")}
        cancelLabel={t("delete.cancel")}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        variant="destructive"
      />
    </Page>
  );
}
