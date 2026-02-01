import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

export interface ComboboxOption<T = string> {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface ComboboxSelectProps<T = string> {
  items: ComboboxOption<T>[];
  value?: T | null;
  onValueChange: (value: T | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  renderItem?: (item: ComboboxOption<T>) => React.ReactNode;
}

export function ComboboxSelect<T = string>({
  items,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No items found.",
  className,
  disabled = false,
  renderItem,
}: ComboboxSelectProps<T>) {
  // Find the selected item
  const selectedItem = items.find((item) => item.value === value);

  // Create a default item for placeholder
  const defaultItem: ComboboxOption<T> = {
    value: null as T,
    label: placeholder,
  };

  return (
    <Combobox
      items={items}
      value={selectedItem || defaultItem}
      onValueChange={(item) => {
        if (item && item.value !== null) {
          onValueChange(item.value);
        } else {
          onValueChange(null);
        }
      }}
    >
      <ComboboxTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between font-normal",
              !selectedItem && "text-muted-foreground",
              className,
            )}
            disabled={disabled}
          >
            <ComboboxValue />
          </Button>
        }
      />
      <ComboboxContent>
        <ComboboxInput showTrigger={false} placeholder={searchPlaceholder} />
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem
              key={String(item.value)}
              value={item}
              disabled={item.disabled}
            >
              {renderItem ? (
                renderItem(item)
              ) : item.description ? (
                <div className="flex flex-col">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </div>
              ) : (
                item.label
              )}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
