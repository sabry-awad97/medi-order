import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  ReferenceDot,
  Label,
} from "recharts";
import { format } from "date-fns";
import { useTranslation, useDirection } from "@meditrack/i18n";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PriceHistoryEntry } from "@/api/inventory.api";

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

  const chartConfig = {
    price: {
      label: t("itemDetails.price"),
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  const priceStats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        trend: "stable" as const,
        change: 0,
        changePercent: 0,
        minPrice: currentPrice,
        maxPrice: currentPrice,
        avgPrice: currentPrice,
        minDataPoint: null,
        maxDataPoint: null,
      };
    }

    const prices = chartData.map((d) => d.price);
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const change = lastPrice - firstPrice;
    const changePercent = firstPrice > 0 ? (change / firstPrice) * 100 : 0;

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const minDataPoint = chartData.find((d) => d.price === minPrice) || null;
    const maxDataPoint = chartData.find((d) => d.price === maxPrice) || null;

    return {
      trend:
        changePercent > 1
          ? ("up" as const)
          : changePercent < -1
            ? ("down" as const)
            : ("stable" as const),
      change,
      changePercent,
      minPrice,
      maxPrice,
      avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
      minDataPoint,
      maxDataPoint,
    };
  }, [chartData, currentPrice]);

  if (chartData.length === 0) {
    return (
      <Card className={cn("border-muted/40", className)}>
        <CardHeader className="pb-3">
          <CardTitle
            className={cn(
              "flex items-center gap-2 text-base font-semibold",
              isRTL && "flex-row-reverse",
            )}
          >
            <TrendingUp className="h-4 w-4 text-primary" />
            {t("itemDetails.priceHistory")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex items-center justify-center h-[140px] text-sm text-muted-foreground">
            {t("itemDetails.noPriceHistory")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-muted/40", className)}>
      <CardHeader className="pb-3">
        <div
          className={cn(
            "flex items-center justify-between gap-4",
            isRTL && "flex-row-reverse",
          )}
        >
          <CardTitle
            className={cn(
              "flex items-center gap-2 text-base font-semibold",
              isRTL && "flex-row-reverse",
            )}
          >
            <TrendingUp className="h-4 w-4 text-primary" />
            {t("itemDetails.priceHistory")}
          </CardTitle>
          <div
            className={cn(
              "flex items-center gap-1.5",
              isRTL && "flex-row-reverse",
            )}
          >
            {priceStats.trend === "up" && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-500">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold">
                  +{priceStats.changePercent.toFixed(1)}%
                </span>
              </div>
            )}
            {priceStats.trend === "down" && (
              <div className="flex items-center gap-1 text-red-600 dark:text-red-500">
                <TrendingDown className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold">
                  {priceStats.changePercent.toFixed(1)}%
                </span>
              </div>
            )}
            {priceStats.trend === "stable" && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Minus className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold">
                  {t("itemDetails.stable")}
                </span>
              </div>
            )}
          </div>
        </div>
        <CardDescription className="mt-2">
          {chartData.length} {t("itemDetails.priceChanges")}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 24,
              left: 30,
              right: 30,
              bottom: 16,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="formattedDate"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              reversed={false}
              padding={{ left: 30, right: 30 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tickFormatter={(value) => "$" + value}
              orientation="left"
              width={55}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value) => (
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-base">
                        ${Number(value).toFixed(2)}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Line
              dataKey="price"
              type="natural"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{
                fill: "#8b5cf6",
                r: 5,
              }}
              activeDot={{
                r: 7,
                fill: "#8b5cf6",
              }}
            />
            {priceStats.minDataPoint && (
              <ReferenceDot
                x={priceStats.minDataPoint.formattedDate}
                y={priceStats.minDataPoint.price}
                r={8}
                fill="#3b82f6"
                stroke="#fff"
                strokeWidth={2}
              >
                <Label
                  value={t("itemDetails.minPrice")}
                  position="bottom"
                  fill="#3b82f6"
                  fontSize={11}
                  fontWeight="bold"
                  offset={8}
                />
              </ReferenceDot>
            )}
            {priceStats.maxDataPoint && (
              <ReferenceDot
                x={priceStats.maxDataPoint.formattedDate}
                y={priceStats.maxDataPoint.price}
                r={8}
                fill="#f97316"
                stroke="#fff"
                strokeWidth={2}
              >
                <Label
                  value={t("itemDetails.maxPrice")}
                  position="top"
                  fill="#f97316"
                  fontSize={11}
                  fontWeight="bold"
                  offset={8}
                />
              </ReferenceDot>
            )}
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm pt-0">
        <div className="grid grid-cols-3 gap-4 w-full">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {t("itemDetails.minPrice")}
            </p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              ${priceStats.minPrice.toFixed(2)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {t("itemDetails.avgPrice")}
            </p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
              ${priceStats.avgPrice.toFixed(2)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {t("itemDetails.maxPrice")}
            </p>
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
              ${priceStats.maxPrice.toFixed(2)}
            </p>
          </div>
        </div>
        {priceStats.trend !== "stable" && (
          <div
            className={cn(
              "flex gap-2 leading-none font-medium",
              isRTL && "flex-row-reverse",
            )}
          >
            {priceStats.trend === "up" ? (
              <>
                <span className="text-green-600 dark:text-green-500">
                  {t("itemDetails.trendingUp")}{" "}
                  {priceStats.changePercent.toFixed(1)}%
                </span>
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-500" />
              </>
            ) : (
              <>
                <span className="text-red-600 dark:text-red-500">
                  {t("itemDetails.trendingDown")}{" "}
                  {Math.abs(priceStats.changePercent).toFixed(1)}%
                </span>
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-500" />
              </>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
