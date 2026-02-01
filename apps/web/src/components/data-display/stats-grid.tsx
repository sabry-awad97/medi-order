import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageSection } from "@/components/ui/page";
import { cn } from "@/lib/utils";

export interface StatItem {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  description?: string;
}

interface StatsGridProps {
  stats: StatItem[];
  columns?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    "2xl"?: number;
  };
  className?: string;
  showBorder?: boolean;
}

export function StatsGrid({
  stats,
  columns = {
    default: 2,
    md: 3,
    lg: 5,
  },
  className,
  showBorder = true,
}: StatsGridProps) {
  const gridCols = cn(
    columns.default && `grid-cols-${columns.default}`,
    columns.sm && `sm:grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`,
    columns["2xl"] && `2xl:grid-cols-${columns["2xl"]}`,
  );

  return (
    <PageSection
      className={cn(
        "mb-4 pb-4 shrink-0",
        showBorder && "border-b border-dashed",
        className,
      )}
    >
      <div className={cn("grid gap-3", gridCols)}>
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    </PageSection>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  description?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  color,
  description,
}: StatCardProps) {
  return (
    <Card className="p-0 border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 py-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("p-1 rounded-md", color, "bg-opacity-10")}>
          <Icon className={cn("h-3.5 w-3.5", color.replace("bg-", "text-"))} />
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-2 pt-0">
        <div className="text-xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
