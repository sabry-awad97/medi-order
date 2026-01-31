import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { useTranslation, useDirection } from "@meditrack/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PriceHistoryEntry {
  id: string;
  inventory_item_id: string;
  unit_price: number;
  recorded_at: string;
  changed_by?: string | null;
  reason?: string | null;
}

interface PriceHistoryChartProps {
  data: PriceHistoryEntry[];
  currentPrice: number;
  className?: string;
}

export function PriceHistoryChart({
  data,
  currentPrice,
  className,
}: PriceHistoryChartProps) {
  const { t } = useTranslation("inventory");
  const { isRTL } = useDirection();

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data
      .map((entry) => ({
        date: new Date(entry.recorded_at).getTime(),
        price:
          typeof entry.unit_price === "string"
            ? parseFloat(entry.unit_price)
            : entry.unit_price,
        formattedDate: format(new Date(entry.recorded_at), "MMM dd, yyyy"),
        reason: entry.reason,
      }))
      .sort((a, b) => a.date - b.date);
  }, [data]);

  const priceStats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        trend: "stable" as const,
        change: 0,
        changePercent: 0,
        minPrice: currentPrice,
        maxPrice: currentPrice,
        avgPrice: currentPrice,
      };
    }

    const prices = chartData.map((d) => d.price);
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const change = lastPrice - firstPrice;
    const changePercent = firstPrice > 0 ? (change / firstPrice) * 100 : 0;

    return {
      trend:
        changePercent > 1
          ? ("up" as const)
          : changePercent < -1
            ? ("down" as const)
            : ("stable" as const),
      change,
      changePercent,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
    };
  }, [chartData, currentPrice]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm mb-1">{data.formattedDate}</p>
          <p className="text-lg font-bold text-primary">
            ${data.price.toFixed(2)}
          </p>
          {data.reason && (
            <p className="text-xs text-muted-foreground mt-1">{data.reason}</p>
          )}
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle
            className={cn(
              "flex items-center gap-2 text-lg",
              isRTL && "flex-row-reverse",
            )}
          >
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-500" />
            {t("itemDetails.priceHistory")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            {t("itemDetails.noPriceHistory")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div
          className={cn(
            "flex items-center justify-between",
            isRTL && "flex-row-reverse",
          )}
        >
          <CardTitle
            className={cn(
              "flex items-center gap-2 text-lg",
              isRTL && "flex-row-reverse",
            )}
          >
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-500" />
            {t("itemDetails.priceHistory")}
          </CardTitle>
          <div
            className={cn(
              "flex items-center gap-2",
              isRTL && "flex-row-reverse",
            )}
          >
            {priceStats.trend === "up" && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-500">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">
                  +{priceStats.changePercent.toFixed(1)}%
                </span>
              </div>
            )}
            {priceStats.trend === "down" && (
              <div className="flex items-center gap-1 text-red-600 dark:text-red-500">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {priceStats.changePercent.toFixed(1)}%
                </span>
              </div>
            )}
            {priceStats.trend === "stable" && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Minus className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {t("itemDetails.stable")}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Price Statistics */}
          <div className="grid grid-cols-3 gap-3 pb-4 border-b">
            <div className="text-center space-y-1">
              <p className="text-xs text-muted-foreground">
                {t("itemDetails.minPrice")}
              </p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-500">
                ${priceStats.minPrice.toFixed(2)}
              </p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs text-muted-foreground">
                {t("itemDetails.avgPrice")}
              </p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-500">
                ${priceStats.avgPrice.toFixed(2)}
              </p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs text-muted-foreground">
                {t("itemDetails.maxPrice")}
              </p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-500">
                ${priceStats.maxPrice.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  reversed={isRTL}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  tickFormatter={(value) => `$${value}`}
                  orientation={isRTL ? "right" : "left"}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px" }} iconType="line" />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                  activeDot={{ r: 6 }}
                  name={t("itemDetails.unitPrice")}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
