import { cn } from "@/lib/utils";

interface DataGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  columns?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    "2xl"?: number;
  };
  gap?: number;
  className?: string;
}

export function DataGrid<T>({
  items,
  renderItem,
  columns = {
    default: 1,
    sm: 2,
    lg: 3,
    xl: 4,
    "2xl": 5,
  },
  gap = 4,
  className,
}: DataGridProps<T>) {
  const gridCols = cn(
    columns.default && `grid-cols-${columns.default}`,
    columns.sm && `sm:grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`,
    columns["2xl"] && `2xl:grid-cols-${columns["2xl"]}`,
  );

  return (
    <div
      className={cn(
        "h-full overflow-y-auto pb-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
        className,
      )}
    >
      <div
        className={cn("grid max-w-[2000px] mx-auto", gridCols, `gap-${gap}`)}
      >
        {items.map((item, index) => renderItem(item, index))}
      </div>
    </div>
  );
}
