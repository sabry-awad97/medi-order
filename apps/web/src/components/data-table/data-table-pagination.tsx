import type { Table } from "@tanstack/react-table";
import {
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useDirection } from "@meditrack/i18n";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataTablePaginationProps<T> {
  table: Table<T>;
  totalItems: number;
  pageSizeOptions?: number[];
  labels?: {
    showing?: string;
    to?: string;
    of?: string;
    items?: string;
    rowsPerPage?: string;
    previous?: string;
    next?: string;
    firstPage?: string;
    lastPage?: string;
    previousPage?: string;
    nextPage?: string;
  };
  generatePaginationItems?: (
    currentPage: number,
    totalPages: number,
  ) => (number | "ellipsis")[];
}

const defaultGeneratePaginationItems = (
  currentPage: number,
  totalPages: number,
): (number | "ellipsis")[] => {
  const delta = 2;
  const range: number[] = [];
  const rangeWithDots: (number | "ellipsis")[] = [];
  let l: number | undefined;

  for (let i = 0; i < totalPages; i++) {
    if (
      i === 0 ||
      i === totalPages - 1 ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      range.push(i);
    }
  }

  for (const i of range) {
    if (l !== undefined) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push("ellipsis");
      }
    }
    rangeWithDots.push(i);
    l = i;
  }

  return rangeWithDots;
};

export function DataTablePagination<T>({
  table,
  totalItems,
  pageSizeOptions = [10, 20, 30, 50, 100],
  labels = {},
  generatePaginationItems = defaultGeneratePaginationItems,
}: DataTablePaginationProps<T>) {
  const { isRTL } = useDirection();

  const defaultLabels = {
    showing: "Showing",
    to: "to",
    of: "of",
    items: "items",
    rowsPerPage: "Rows per page",
    previous: "Previous",
    next: "Next",
    firstPage: "First page",
    lastPage: "Last page",
    previousPage: "Previous page",
    nextPage: "Next page",
  };

  const t = { ...defaultLabels, ...labels };

  return (
    <div className="flex flex-col gap-4 py-4 shrink-0 border-t bg-muted/20">
      {/* Mobile: Simple pagination */}
      <div className="flex sm:hidden items-center justify-between w-full px-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="gap-1"
        >
          {isRTL ? (
            <>
              <span>{t.previous}</span>
              <ChevronRight className="h-4 w-4" />
            </>
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>{t.previous}</span>
            </>
          )}
        </Button>
        <span className="text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="gap-1"
        >
          {isRTL ? (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>{t.next}</span>
            </>
          ) : (
            <>
              <span>{t.next}</span>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* Tablet & Desktop: Full pagination */}
      <div className="hidden sm:flex flex-col lg:flex-row items-center justify-between gap-4 px-4">
        {/* Items info and page size selector */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {t.showing}{" "}
            <span className="font-medium text-foreground">
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}
            </span>{" "}
            {t.to}{" "}
            <span className="font-medium text-foreground">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                totalItems,
              )}
            </span>{" "}
            {t.of}{" "}
            <span className="font-medium text-foreground">{totalItems}</span>{" "}
            {t.items}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {t.rowsPerPage}
            </span>
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-2">
          <Pagination>
            <PaginationContent>
              {/* First page button */}
              <PaginationItem className="hidden md:block">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  {isRTL ? (
                    <ChevronsRight className="h-4 w-4" />
                  ) : (
                    <ChevronsLeft className="h-4 w-4" />
                  )}
                  <span className="sr-only">{t.firstPage}</span>
                </Button>
              </PaginationItem>

              {/* Previous page button */}
              <PaginationItem>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  {isRTL ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                  <span className="sr-only">{t.previousPage}</span>
                </Button>
              </PaginationItem>

              {/* Page numbers */}
              <div className="hidden md:flex items-center gap-1">
                {generatePaginationItems(
                  table.getState().pagination.pageIndex,
                  table.getPageCount(),
                ).map((item, index) => (
                  <PaginationItem key={index}>
                    {item === "ellipsis" ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        onClick={() => table.setPageIndex(item as number)}
                        isActive={
                          table.getState().pagination.pageIndex === item
                        }
                        className="h-8 w-8 cursor-pointer"
                      >
                        {(item as number) + 1}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
              </div>

              {/* Next page button */}
              <PaginationItem>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  {isRTL ? (
                    <ChevronLeft className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span className="sr-only">{t.nextPage}</span>
                </Button>
              </PaginationItem>

              {/* Last page button */}
              <PaginationItem className="hidden md:block">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  {isRTL ? (
                    <ChevronsLeft className="h-4 w-4" />
                  ) : (
                    <ChevronsRight className="h-4 w-4" />
                  )}
                  <span className="sr-only">{t.lastPage}</span>
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
