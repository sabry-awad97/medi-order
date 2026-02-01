import { Search, Filter, XCircle } from "lucide-react";
import { useDirection } from "@meditrack/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface FilterConfig {
  id: string;
  label: string;
  component: React.ReactNode;
}

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  activeFiltersCount?: number;
  onClearFilters?: () => void;
  totalItems?: number;
  filteredItemsCount?: number;
  showFilterSummary?: boolean;
  filterSummaryLabel?: (filtered: number, total: number) => string;
  mobileSheetTitle?: string;
  mobileSheetDescription?: string;
  clearFiltersLabel?: string;
  filtersLabel?: string;
  className?: string;
}

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  activeFiltersCount = 0,
  onClearFilters,
  totalItems,
  filteredItemsCount,
  showFilterSummary = true,
  filterSummaryLabel = (filtered, total) =>
    `Showing ${filtered} of ${total} items`,
  mobileSheetTitle = "Filters",
  mobileSheetDescription = "Filter items by various criteria",
  clearFiltersLabel = "Clear",
  filtersLabel = "Filters",
  className,
}: SearchFilterBarProps) {
  const { isRTL } = useDirection();

  const hasActiveFilters =
    searchQuery || (activeFiltersCount && activeFiltersCount > 0);

  return (
    <div className={cn("mb-6 flex flex-col gap-4 shrink-0", className)}>
      {/* Search and Filters Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative w-full md:w-[400px]">
          <Search
            className={cn(
              "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
              isRTL ? "right-3" : "left-3",
            )}
          />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={isRTL ? "pr-10" : "pl-10"}
          />
        </div>

        {/* Desktop: Inline Filters */}
        {filters.length > 0 && (
          <div className="hidden md:flex flex-row items-center gap-3 flex-1">
            {filters.map((filter) => (
              <div key={filter.id}>{filter.component}</div>
            ))}

            {/* Clear Filters */}
            {activeFiltersCount > 0 && onClearFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="gap-2"
              >
                <XCircle className="h-4 w-4" />
                <span>
                  {clearFiltersLabel} ({activeFiltersCount})
                </span>
              </Button>
            )}
          </div>
        )}

        {/* Mobile: Filter Sheet */}
        {filters.length > 0 && (
          <Sheet>
            <SheetTrigger
              render={<Button variant="outline" className="gap-2 shrink-0" />}
              className="md:hidden"
            >
              <Filter className="h-4 w-4" />
              <span>{filtersLabel}</span>
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
                <SheetTitle>{mobileSheetTitle}</SheetTitle>
                <SheetDescription>{mobileSheetDescription}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {filters.map((filter) => (
                  <div key={filter.id} className="space-y-2">
                    <label className="text-sm font-medium">
                      {filter.label}
                    </label>
                    {filter.component}
                  </div>
                ))}

                {/* Clear Filters Button */}
                {activeFiltersCount > 0 && onClearFilters && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={onClearFilters}
                  >
                    {clearFiltersLabel} All Filters
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Active Filters Summary */}
      {showFilterSummary &&
        hasActiveFilters &&
        totalItems !== undefined &&
        filteredItemsCount !== undefined && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>{filterSummaryLabel(filteredItemsCount, totalItems)}</span>
          </div>
        )}
    </div>
  );
}
