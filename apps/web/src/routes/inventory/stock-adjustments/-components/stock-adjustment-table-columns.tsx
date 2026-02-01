import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { InventoryItemWithStockResponse } from "@/api/inventory.api";
import { cn } from "@/lib/utils";

interface UseStockAdjustmentColumnsProps {
  t: (key: string) => string;
  isRTL: boolean;
  onAdjust: (item: InventoryItemWithStockResponse) => void;
}

export function useStockAdjustmentColumns({
  t,
  isRTL,
  onAdjust,
}: UseStockAdjustmentColumnsProps): ColumnDef<InventoryItemWithStockResponse>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className={cn("gap-1", isRTL && "flex-row-reverse")}
          >
            {t("table.medicineName")}
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{item.name}</span>
            {item.generic_name && (
              <span className="text-xs text-muted-foreground">
                {item.generic_name}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "form",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className={cn("gap-1", isRTL && "flex-row-reverse")}
          >
            {t("table.form")}
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return <span className="capitalize">{row.getValue("form")}</span>;
      },
    },
    {
      accessorKey: "stock_quantity",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className={cn("gap-1", isRTL && "flex-row-reverse")}
          >
            Current Stock
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const item = row.original;
        const quantity = item.stock_quantity;
        const minLevel = item.min_stock_level;

        const getStockBadge = () => {
          if (quantity === 0) {
            return (
              <Badge variant="destructive" className="font-mono">
                {quantity} {t("table.units")}
              </Badge>
            );
          }
          if (quantity <= minLevel) {
            return (
              <Badge
                variant="secondary"
                className="font-mono bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
              >
                {quantity} {t("table.units")}
              </Badge>
            );
          }
          return (
            <Badge
              variant="default"
              className="font-mono bg-green-500/10 text-green-700 dark:text-green-400"
            >
              {quantity} {t("table.units")}
            </Badge>
          );
        };

        return (
          <div className="flex flex-col gap-1">
            {getStockBadge()}
            <span className="text-xs text-muted-foreground">
              {t("table.minLevel")}: {minLevel}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "min_stock_level",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className={cn("gap-1", isRTL && "flex-row-reverse")}
          >
            Status
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const item = row.original;
        const quantity = item.stock_quantity;
        const minLevel = item.min_stock_level;

        if (quantity === 0) {
          return (
            <Badge variant="destructive">{t("stockStatus.outOfStock")}</Badge>
          );
        }
        if (quantity <= minLevel) {
          return (
            <Badge
              variant="secondary"
              className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
            >
              {t("stockStatus.lowStock")}
            </Badge>
          );
        }
        return (
          <Badge
            variant="default"
            className="bg-green-500/10 text-green-700 dark:text-green-400"
          >
            {t("stockStatus.inStock")}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-center">{t("table.actions")}</div>,
      cell: ({ row }) => {
        const item = row.original;

        return (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAdjust(item)}
              className="gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              {t("actions.adjustStock")}
            </Button>
          </div>
        );
      },
    },
  ];
}
