import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Eye,
  Edit,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { OpeningBalanceResponse } from "@/api/opening-balance.api";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface UseOpeningBalanceColumnsProps {
  t: (key: string) => string;
  isRTL: boolean;
  onViewDetails: (balance: OpeningBalanceResponse) => void;
  onEdit: (balance: OpeningBalanceResponse) => void;
  onVerify: (balance: OpeningBalanceResponse) => void;
  onDelete: (balance: OpeningBalanceResponse) => void;
}

export function useOpeningBalanceColumns({
  t,
  isRTL,
  onViewDetails,
  onEdit,
  onVerify,
  onDelete,
}: UseOpeningBalanceColumnsProps) {
  return useMemo<ColumnDef<OpeningBalanceResponse>[]>(
    () => [
      {
        accessorKey: "inventory_item_name",
        header: t("table.item"),
        cell: ({ row }) => (
          <div className="min-w-[200px]">
            <div className="font-medium">
              {row.original.inventory_item_name}
            </div>
            {row.original.batch_number && (
              <div className="text-xs text-muted-foreground">
                Batch: {row.original.batch_number}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "quantity",
        header: t("table.quantity"),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.quantity}</span>
        ),
      },
      {
        accessorKey: "unit_price",
        header: t("table.unitPrice"),
        cell: ({ row }) => (
          <span className="font-medium">
            ${row.original.unit_price.toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: "total_value",
        header: t("table.totalValue"),
        cell: ({ row }) => (
          <span className="font-semibold text-primary">
            ${row.original.total_value.toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: "entry_date",
        header: t("table.entryDate"),
        cell: ({ row }) => (
          <span className="text-sm">
            {format(new Date(row.original.entry_date), "MMM dd, yyyy")}
          </span>
        ),
      },
      {
        accessorKey: "entry_type",
        header: t("table.entryType"),
        cell: ({ row }) => {
          const typeColors = {
            initial:
              "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
            adjustment:
              "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
            correction:
              "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
            reconciliation:
              "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
          };

          return (
            <Badge
              className={cn(
                "font-normal",
                typeColors[row.original.entry_type as keyof typeof typeColors],
              )}
            >
              {t(`entryTypes.${row.original.entry_type}`)}
            </Badge>
          );
        },
      },
      {
        accessorKey: "is_verified",
        header: t("table.status"),
        cell: ({ row }) => {
          const isVerified = row.original.is_verified;
          return (
            <Badge
              className={cn(
                "gap-1",
                isVerified
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
              )}
            >
              {isVerified ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  {t("status.verified")}
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3" />
                  {t("status.pending")}
                </>
              )}
            </Badge>
          );
        },
      },
      {
        accessorKey: "entered_by_name",
        header: t("table.enteredBy"),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.entered_by_name}
          </span>
        ),
      },
      {
        id: "actions",
        header: t("table.actions"),
        cell: ({ row }) => {
          const balance = row.original;
          const canVerify = !balance.is_verified;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem onClick={() => onViewDetails(balance)}>
                  <Eye className="h-4 w-4" />
                  <span>{t("actions.viewDetails")}</span>
                </DropdownMenuItem>
                {!balance.is_verified && (
                  <DropdownMenuItem onClick={() => onEdit(balance)}>
                    <Edit className="h-4 w-4" />
                    <span>{t("actions.editEntry")}</span>
                  </DropdownMenuItem>
                )}
                {canVerify && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onVerify(balance)}>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{t("actions.verify")}</span>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(balance)}
                >
                  <XCircle className="h-4 w-4" />
                  <span>{t("actions.delete")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [t, isRTL, onViewDetails, onEdit, onVerify, onDelete],
  );
}
