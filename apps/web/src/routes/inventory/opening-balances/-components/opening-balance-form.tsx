import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation, useDirection } from "@meditrack/i18n";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FilterSelect,
  type FilterOption,
  ComboboxSelect,
  type ComboboxOption,
} from "@/components/forms";
import { cn } from "@/lib/utils";
import { useInventoryItems } from "@/hooks";
import type {
  CreateOpeningBalance,
  UpdateOpeningBalance,
  OpeningBalanceResponse,
} from "@/api/opening-balance.api";

interface OpeningBalanceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: OpeningBalanceResponse | null;
  mode: "create" | "edit";
  onSubmit: (data: CreateOpeningBalance | UpdateOpeningBalance) => void;
}

const ENTRY_TYPES = [
  "initial",
  "adjustment",
  "correction",
  "reconciliation",
] as const;

export function OpeningBalanceForm({
  open,
  onOpenChange,
  entry,
  mode,
  onSubmit,
}: OpeningBalanceFormProps) {
  const { t } = useTranslation("opening-balances");
  const { isRTL } = useDirection();
  const { data: inventoryItems = [], isLoading: isLoadingItems } =
    useInventoryItems();

  // Form schema
  const formSchema = z.object({
    inventory_item_id: z.string().min(1, t("form.validation.itemRequired")),
    quantity: z.number().min(0, t("form.validation.quantityMin")),
    unit_price: z.number().min(0, t("form.validation.priceMin")),
    entry_date: z.date(),
    expiry_date: z.date().optional(),
    entry_type: z.enum(ENTRY_TYPES),
    reason: z.string().optional(),
    notes: z.string().optional(),
  });

  type FormData = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inventory_item_id: "",
      quantity: 0,
      unit_price: 0,
      entry_date: new Date(),
      entry_type: "initial",
      reason: "",
      notes: "",
    },
  });

  const watchedValues = watch();
  const totalValue = watchedValues.quantity * watchedValues.unit_price;

  // Inventory items options for combobox
  const inventoryItemOptions: ComboboxOption[] = useMemo(
    () =>
      inventoryItems.map((item: any) => ({
        value: item.id,
        label: item.name,
        description: item.concentration,
      })),
    [inventoryItems],
  );

  // Entry type filter options
  const entryTypeOptions: FilterOption[] = useMemo(
    () => [
      { value: "initial", label: t("entryTypes.initial") },
      { value: "adjustment", label: t("entryTypes.adjustment") },
      { value: "correction", label: t("entryTypes.correction") },
      { value: "reconciliation", label: t("entryTypes.reconciliation") },
    ],
    [t],
  );

  // Reset form when dialog opens/closes or entry changes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && entry) {
        reset({
          inventory_item_id: entry.inventory_item_id,
          quantity: entry.quantity,
          unit_price: parseFloat(entry.unit_price.toString()),
          entry_date: new Date(entry.entry_date),
          expiry_date: entry.expiry_date
            ? new Date(entry.expiry_date)
            : undefined,
          entry_type: entry.entry_type,
          reason: entry.reason || "",
          notes: entry.notes || "",
        });
      } else {
        reset({
          inventory_item_id: "",
          quantity: 0,
          unit_price: 0,
          entry_date: new Date(),
          entry_type: "initial",
          reason: "",
          notes: "",
        });
      }
    }
  }, [open, mode, entry, reset]);

  const handleFormSubmit = (data: FormData) => {
    const submitData = {
      inventory_item_id: data.inventory_item_id,
      quantity: data.quantity,
      unit_price: data.unit_price,
      entry_date: data.entry_date.toISOString(),
      expiry_date: data.expiry_date?.toISOString(),
      entry_type: data.entry_type,
      reason: data.reason || undefined,
      notes: data.notes || undefined,
    };
    onSubmit(submitData);
    onOpenChange(false);
  };

  const textAlign = isRTL ? "text-right" : "text-left";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className={textAlign}>
            {mode === "create" ? t("form.createTitle") : t("form.editTitle")}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="flex flex-col"
        >
          <div className="px-6 py-6 overflow-y-auto flex-1">
            <div className="space-y-6">
              {/* Item Selection Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="inventory_item_id"
                    className={cn("text-base font-semibold", textAlign)}
                  >
                    {t("form.inventoryItem")}
                  </Label>
                  <ComboboxSelect
                    items={inventoryItemOptions}
                    value={watchedValues.inventory_item_id || null}
                    onValueChange={(value) =>
                      value && setValue("inventory_item_id", value)
                    }
                    placeholder={t("form.selectItem")}
                    searchPlaceholder={t("form.searchItem")}
                    emptyMessage={t("form.noItemsFound")}
                    className={cn("h-11", textAlign)}
                    disabled={mode === "edit"}
                  />
                  {errors.inventory_item_id?.message && (
                    <p className="text-sm text-destructive">
                      {errors.inventory_item_id.message}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Quantity & Pricing Section */}
              <div className="space-y-4">
                <h3 className={cn("text-base font-semibold", textAlign)}>
                  {t("form.quantityAndPricing")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Quantity */}
                  <div className="space-y-2">
                    <Label htmlFor="quantity" className={textAlign}>
                      {t("form.quantity")}
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="1"
                      min="0"
                      {...register("quantity", { valueAsNumber: true })}
                      placeholder={t("form.quantityPlaceholder")}
                      className={cn("h-11", textAlign)}
                    />
                    {errors.quantity?.message && (
                      <p className="text-sm text-destructive">
                        {errors.quantity.message}
                      </p>
                    )}
                  </div>

                  {/* Unit Price */}
                  <div className="space-y-2">
                    <Label htmlFor="unit_price" className={textAlign}>
                      {t("form.unitPrice")}
                    </Label>
                    <Input
                      id="unit_price"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register("unit_price", { valueAsNumber: true })}
                      placeholder={t("form.unitPricePlaceholder")}
                      className={cn("h-11", textAlign)}
                    />
                    {errors.unit_price?.message && (
                      <p className="text-sm text-destructive">
                        {errors.unit_price.message}
                      </p>
                    )}
                  </div>

                  {/* Total Value (Computed) */}
                  <div className="space-y-2">
                    <Label className={textAlign}>{t("form.totalValue")}</Label>
                    <div
                      className={cn(
                        "h-11 px-4 rounded-md border bg-muted/50 flex items-center",
                        textAlign,
                      )}
                    >
                      <span className="text-2xl font-bold text-primary">
                        ${totalValue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Dates Section */}
              <div className="space-y-4">
                <h3 className={cn("text-base font-semibold", textAlign)}>
                  {t("form.dates")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Entry Date */}
                  <div className="space-y-2">
                    <Label htmlFor="entry_date" className={textAlign}>
                      {t("form.entryDate")}
                    </Label>
                    <Popover>
                      <PopoverTrigger
                        render={(props) => (
                          <Button
                            {...props}
                            variant="outline"
                            className={cn(
                              "w-full h-11 justify-start text-left font-normal",
                              !watchedValues.entry_date &&
                                "text-muted-foreground",
                              isRTL && "flex-row-reverse text-right",
                            )}
                          >
                            <CalendarIcon
                              className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")}
                            />
                            {watchedValues.entry_date ? (
                              format(watchedValues.entry_date, "PPP")
                            ) : (
                              <span>{t("form.selectDate")}</span>
                            )}
                          </Button>
                        )}
                      />
                      <PopoverContent
                        className="w-auto p-0"
                        align={isRTL ? "end" : "start"}
                      >
                        <Calendar
                          mode="single"
                          selected={watchedValues.entry_date}
                          onSelect={(date) =>
                            date && setValue("entry_date", date)
                          }
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.entry_date?.message && (
                      <p className="text-sm text-destructive">
                        {errors.entry_date.message}
                      </p>
                    )}
                  </div>

                  {/* Expiry Date */}
                  <div className="space-y-2">
                    <Label htmlFor="expiry_date" className={textAlign}>
                      {t("form.expiryDate")}
                    </Label>
                    <Popover>
                      <PopoverTrigger
                        render={(props) => (
                          <Button
                            {...props}
                            variant="outline"
                            className={cn(
                              "w-full h-11 justify-start text-left font-normal",
                              !watchedValues.expiry_date &&
                                "text-muted-foreground",
                              isRTL && "flex-row-reverse text-right",
                            )}
                          >
                            <CalendarIcon
                              className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")}
                            />
                            {watchedValues.expiry_date ? (
                              format(watchedValues.expiry_date, "PPP")
                            ) : (
                              <span>{t("form.selectDate")}</span>
                            )}
                          </Button>
                        )}
                      />
                      <PopoverContent
                        className="w-auto p-0"
                        align={isRTL ? "end" : "start"}
                      >
                        <Calendar
                          mode="single"
                          selected={watchedValues.expiry_date}
                          onSelect={(date) => setValue("expiry_date", date)}
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Entry Details Section */}
              <div className="space-y-4">
                <h3 className={cn("text-base font-semibold", textAlign)}>
                  {t("form.entryDetails")}
                </h3>

                {/* Entry Type */}
                <div className="space-y-2">
                  <Label htmlFor="entry_type" className={textAlign}>
                    {t("form.entryType")}
                  </Label>
                  <FilterSelect
                    items={entryTypeOptions}
                    value={watchedValues.entry_type}
                    onValueChange={(value) => {
                      if (value && value !== "all") {
                        setValue("entry_type", value);
                      }
                    }}
                    placeholder={t("form.selectEntryType")}
                    className={cn("h-11 w-full", textAlign)}
                  />
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <Label htmlFor="reason" className={textAlign}>
                    {t("form.reason")}
                  </Label>
                  <Textarea
                    id="reason"
                    {...register("reason")}
                    placeholder={t("form.reasonPlaceholder")}
                    className={textAlign}
                    rows={2}
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className={textAlign}>
                    {t("form.notes")}
                  </Label>
                  <Textarea
                    id="notes"
                    {...register("notes")}
                    placeholder={t("form.notesPlaceholder")}
                    className={textAlign}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-muted/30">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("form.cancel")}
            </Button>
            <Button type="submit">{t("form.submit")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
