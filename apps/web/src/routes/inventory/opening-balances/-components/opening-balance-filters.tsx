import { Filter, XCircle } from "lucide-react";
import { useTranslation, useDirection } from "@meditrack/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  SearchInput,
  FilterSelect,
  type FilterOption,
} from "@/components/forms";
import { cn } from "@/lib/utils";

interface OpeningBalanceFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  verificationFilter: "all" | "verified" | "pending" | null;
  onVerificationFilterChange: (
    value: "all" | "verified" | "pending" | null,
  ) => void;
  entryTypeFilter:
    | "all"
    | "initial"
    | "adjustment"
    | "correction"
    | "reconciliation"
    | null;
  onEntryTypeFilterChange: (
    value:
      | "all"
      | "initial"
      | "adjustment"
      | "correction"
      | "reconciliation"
      | null,
  ) => void;
  activeFiltersCount: number;
  onClearFilters: () => void;
  totalItems: number;
  filteredItemsCount: number;
}

export function OpeningBalanceFilters({
  searchQuery,
  onSearchChange,
  verificationFilter,
  onVerificationFilterChange,
  entryTypeFilter,
  onEntryTypeFilterChange,
  activeFiltersCount,
  onClearFilters,
  totalItems,
  filteredItemsCount,
}: OpeningBalanceFiltersProps) {
  const { t } = useTranslation("opening-balances");
  const { isRTL } = useDirection();

  const hasActiveFilters =
    searchQuery ||
    (verificationFilter && verificationFilter !== "all") ||
    (entryTypeFilter && entryTypeFilter !== "all");

  const verificationFilterItems: FilterOption[] = [
    { value: null, label: t("filters.filterByVerification") },
    { value: "all", label: t("filters.verificationAll") },
    {
      value: "verified",
      label: t("filters.verificationVerified"),
    },
    {
      value: "pending",
      label: t("filters.verificationPending"),
    },
  ];

  const entryTypeFilterItems: FilterOption[] = [
    { value: null, label: t("filters.filterByEntryType") },
    { value: "all", label: t("filters.entryTypeAll") },
    { value: "initial", label: t("entryTypes.initial") },
    { value: "adjustment", label: t("entryTypes.adjustment") },
    { value: "correction", label: t("entryTypes.correction") },
    {
      value: "reconciliation",
      label: t("entryTypes.reconciliation"),
    },
  ];

  return (
    <div className="mb-6 flex flex-col gap-4 shrink-0">
      {/* Search and Filters Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={t("filters.search")}
          className="w-full md:w-[400px]"
        />

        {/* Desktop: Inline Filters */}
        <div className="hidden md:flex flex-row items-center gap-3 flex-1">
          {/* Verification Filter */}
          <FilterSelect
            items={verificationFilterItems}
            value={verificationFilter}
            onValueChange={onVerificationFilterChange}
            placeholder={t("filters.verificationAll")}
            className="w-[180px]"
          />

          {/* Entry Type Filter */}
          <FilterSelect
            items={entryTypeFilterItems}
            value={entryTypeFilter}
            onValueChange={onEntryTypeFilterChange}
            placeholder={t("filters.entryTypeAll")}
            className="w-[180px]"
          />

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              <span>
                {t("filters.clearFilters")} ({activeFiltersCount})
              </span>
            </Button>
          )}
        </div>

        {/* Mobile: Filter Sheet */}
        <Sheet>
          <SheetTrigger
            render={<Button variant="outline" className="gap-2 shrink-0" />}
            className="md:hidden"
          >
            <Filter className="h-4 w-4" />
            <span>{t("filters.filters")}</span>
            {activeFiltersCount > 0 && (
              <Badge
                variant="secondary"
                className={cn(
                  "h-5 w-5 rounded-full p-0 flex items-center justify-center",
                  isRTL ? "mr-1" : "ml-1",
                )}
              >
                {activeFiltersCount}
              </Badge>
            )}
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>{t("filters.filters")}</SheetTitle>
              <SheetDescription>{t("filters.description")}</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {/* Verification Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("filters.filterByVerification")}
                </label>
                <FilterSelect
                  items={verificationFilterItems}
                  value={verificationFilter}
                  onValueChange={onVerificationFilterChange}
                  placeholder={t("filters.verificationAll")}
                  className="w-full"
                />
              </div>

              {/* Entry Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("filters.filterByEntryType")}
                </label>
                <FilterSelect
                  items={entryTypeFilterItems}
                  value={entryTypeFilter}
                  onValueChange={onEntryTypeFilterChange}
                  placeholder={t("filters.entryTypeAll")}
                  className="w-full"
                />
              </div>

              {/* Clear Filters Button */}
              {activeFiltersCount > 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onClearFilters}
                >
                  {t("filters.clearFilters")}
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>
            {t("filters.showing", {
              count: filteredItemsCount,
              total: totalItems,
            })}
          </span>
        </div>
      )}
    </div>
  );
}
