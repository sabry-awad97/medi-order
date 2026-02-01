import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type TableOptions,
  type OnChangeFn,
} from "@tanstack/react-table";
import { useDirection } from "@meditrack/i18n";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DataTablePagination } from "./data-table-pagination";

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  pageSize?: number;
  pageSizeOptions?: number[];
  enablePagination?: boolean;
  paginationLabels?: Parameters<typeof DataTablePagination>[0]["labels"];
  emptyMessage?: string;
  className?: string;
  tableOptions?: Partial<TableOptions<TData>>;
}

export function DataTable<TData>({
  data,
  columns,
  sorting,
  onSortingChange,
  pageSize = 20,
  pageSizeOptions,
  enablePagination = true,
  paginationLabels,
  emptyMessage = "No results.",
  className,
  tableOptions,
}: DataTableProps<TData>) {
  const { isRTL } = useDirection();

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: enablePagination
      ? getPaginationRowModel()
      : undefined,
    initialState: {
      pagination: enablePagination
        ? {
            pageSize,
          }
        : undefined,
    },
    ...tableOptions,
  });

  return (
    <div
      className={cn(
        "h-full flex flex-col animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
        className,
      )}
    >
      <div className="flex-1 overflow-auto border rounded-lg">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(isRTL ? "text-right" : "text-left")}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(isRTL ? "text-right" : "text-left")}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {enablePagination && (
        <DataTablePagination
          table={table}
          totalItems={data.length}
          pageSizeOptions={pageSizeOptions}
          labels={paginationLabels}
        />
      )}
    </div>
  );
}
