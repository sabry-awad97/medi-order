import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Package,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Clock,
  CheckCircle,
  TruckIcon,
  XCircle,
  Plus,
  Search,
  BarChart3,
  Users,
  Tablets,
  Factory,
  Settings,
  ClipboardList,
  Box,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";
import { useTranslation, useDirection } from "@meditrack/i18n";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Page,
  PageHeader,
  PageHeaderTrigger,
  PageHeaderContent,
  PageHeaderTitle,
  PageHeaderDescription,
  PageContent,
  PageContentInner,
} from "@/components/ui/page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Badge } from "@/components/ui/badge";
import { useOrders, useSuppliers, useInventoryItems } from "@/hooks";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

// Navigation card type
interface NavCard {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: React.ElementType;
  href: string;
  color: string;
  bgColor: string;
}

const navigationCards: NavCard[] = [
  {
    id: "orders",
    titleKey: "nav.orders",
    descriptionKey: "nav.ordersDesc",
    icon: Box,
    href: "/special-orders",
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "inventory",
    titleKey: "nav.inventory",
    descriptionKey: "nav.inventoryDesc",
    icon: Package,
    href: "/inventory/items",
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
  },
  {
    id: "itemInquiry",
    titleKey: "nav.itemInquiry",
    descriptionKey: "nav.itemInquiryDesc",
    icon: Search,
    href: "/inventory/item-inquiry",
    color: "text-violet-600",
    bgColor: "bg-violet-500/10",
  },
  {
    id: "suppliers",
    titleKey: "nav.suppliers",
    descriptionKey: "nav.suppliersDesc",
    icon: Users,
    href: "/suppliers",
    color: "text-cyan-600",
    bgColor: "bg-cyan-500/10",
  },
  {
    id: "openingBalances",
    titleKey: "nav.openingBalances",
    descriptionKey: "nav.openingBalancesDesc",
    icon: ClipboardList,
    href: "/inventory/opening-balances",
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
  },
  {
    id: "medicineForms",
    titleKey: "nav.medicineForms",
    descriptionKey: "nav.medicineFormsDesc",
    icon: Tablets,
    href: "/inventory/medicine-forms",
    color: "text-pink-600",
    bgColor: "bg-pink-500/10",
  },
  {
    id: "manufacturers",
    titleKey: "nav.manufacturers",
    descriptionKey: "nav.manufacturersDesc",
    icon: Factory,
    href: "/inventory/manufacturers",
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
  },
  {
    id: "reports",
    titleKey: "nav.reports",
    descriptionKey: "nav.reportsDesc",
    icon: BarChart3,
    href: "/reports",
    color: "text-green-600",
    bgColor: "bg-green-500/10",
  },
  {
    id: "settings",
    titleKey: "nav.settings",
    descriptionKey: "nav.settingsDesc",
    icon: Settings,
    href: "/settings",
    color: "text-slate-600",
    bgColor: "bg-slate-500/10",
  },
];

function HomeComponent() {
  const { t } = useTranslation("home");
  const { isRTL } = useDirection();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  // Fetch real data
  const { data: orders = [] } = useOrders();
  const { data: suppliers = [] } = useSuppliers();
  const { data: inventoryItems = [] } = useInventoryItems();

  // Calculate order statistics
  const orderStats = useMemo(() => {
    const pending = orders.filter((o) => o.status === "pending").length;
    const ordered = orders.filter((o) => o.status === "ordered").length;
    const arrived = orders.filter((o) => o.status === "arrived").length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const cancelled = orders.filter((o) => o.status === "cancelled").length;
    const total = orders.length;

    return { pending, ordered, arrived, delivered, cancelled, total };
  }, [orders]);

  // Calculate inventory statistics
  const inventoryStats = useMemo(() => {
    const totalItems = inventoryItems.length;
    const lowStock = inventoryItems.filter(
      (item) =>
        item.stock_quantity > 0 && item.stock_quantity <= item.min_stock_level,
    ).length;
    const outOfStock = inventoryItems.filter(
      (item) => item.stock_quantity === 0,
    ).length;
    const inStock = totalItems - lowStock - outOfStock;

    return { totalItems, lowStock, outOfStock, inStock };
  }, [inventoryItems]);

  return (
    <ProtectedRoute>
      <Page>
        <PageHeader>
          <PageHeaderTrigger />
          <PageHeaderContent>
            <PageHeaderTitle>{t("title")}</PageHeaderTitle>
            <PageHeaderDescription>{t("subtitle")}</PageHeaderDescription>
          </PageHeaderContent>
        </PageHeader>

        <PageContent>
          <PageContentInner className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            <div className="w-full space-y-8 pb-8">
              {/* Stats Overview */}
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Orders */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <Box className="h-4 w-4" />
                      {t("stats.totalOrders")}
                    </CardDescription>
                    <CardTitle className="text-3xl">
                      {orderStats.total}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Activity className="h-4 w-4" />
                      <span>
                        {t("stats.activeOrders", {
                          count:
                            orderStats.pending +
                            orderStats.ordered +
                            orderStats.arrived,
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Pending Orders */}
                <Card className="border-l-4 border-l-yellow-500">
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {t("stats.pendingOrders")}
                    </CardDescription>
                    <CardTitle className="text-3xl">
                      {orderStats.pending}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm">
                      {orderStats.pending > 0 ? (
                        <Badge
                          variant="outline"
                          className="text-yellow-600 border-yellow-300 bg-yellow-50"
                        >
                          {t("stats.needsAttention")}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">
                          {t("stats.allClear")}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Total Inventory */}
                <Card className="border-l-4 border-l-emerald-500">
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      {t("stats.totalItems")}
                    </CardDescription>
                    <CardTitle className="text-3xl">
                      {inventoryStats.totalItems}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>
                        {t("stats.inStock", { count: inventoryStats.inStock })}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Alerts */}
                <Card
                  className={`border-l-4 ${inventoryStats.lowStock + inventoryStats.outOfStock > 0 ? "border-l-red-500" : "border-l-green-500"}`}
                >
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      {t("stats.stockAlerts")}
                    </CardDescription>
                    <CardTitle className="text-3xl">
                      {inventoryStats.lowStock + inventoryStats.outOfStock}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm">
                      {inventoryStats.outOfStock > 0 && (
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle className="h-3 w-3" />
                          {inventoryStats.outOfStock} {t("stats.outOfStock")}
                        </span>
                      )}
                      {inventoryStats.lowStock > 0 && (
                        <span className="flex items-center gap-1 text-yellow-600">
                          <TrendingDown className="h-3 w-3" />
                          {inventoryStats.lowStock} {t("stats.lowStock")}
                        </span>
                      )}
                      {inventoryStats.lowStock + inventoryStats.outOfStock ===
                        0 && (
                        <span className="text-green-600">
                          {t("stats.stockHealthy")}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Quick Actions */}
              <section className="bg-muted/30 rounded-xl p-6 border">
                <h2 className="text-lg font-semibold mb-4">
                  {t("quickActions.title")}
                </h2>
                <div className="flex flex-wrap gap-3">
                  <Link to="/special-orders">
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      {t("quickActions.newOrder")}
                    </Button>
                  </Link>
                  <Link to="/inventory/items">
                    <Button variant="outline" className="gap-2">
                      <Package className="h-4 w-4" />
                      {t("quickActions.addItem")}
                    </Button>
                  </Link>
                  <Link to="/inventory/item-inquiry">
                    <Button variant="outline" className="gap-2">
                      <Search className="h-4 w-4" />
                      {t("quickActions.searchItem")}
                    </Button>
                  </Link>
                  <Link to="/reports">
                    <Button variant="outline" className="gap-2">
                      <BarChart3 className="h-4 w-4" />
                      {t("quickActions.viewReports")}
                    </Button>
                  </Link>
                </div>
              </section>

              {/* Order Status Summary */}
              <section>
                <h2 className="text-lg font-semibold mb-4">
                  {t("orderStatus.title")}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <StatusCard
                    label={t("orderStatus.pending")}
                    count={orderStats.pending}
                    icon={Clock}
                    color="text-yellow-600"
                    bgColor="bg-yellow-500/10"
                  />
                  <StatusCard
                    label={t("orderStatus.ordered")}
                    count={orderStats.ordered}
                    icon={Box}
                    color="text-blue-600"
                    bgColor="bg-blue-500/10"
                  />
                  <StatusCard
                    label={t("orderStatus.arrived")}
                    count={orderStats.arrived}
                    icon={TruckIcon}
                    color="text-purple-600"
                    bgColor="bg-purple-500/10"
                  />
                  <StatusCard
                    label={t("orderStatus.delivered")}
                    count={orderStats.delivered}
                    icon={CheckCircle}
                    color="text-green-600"
                    bgColor="bg-green-500/10"
                  />
                  <StatusCard
                    label={t("orderStatus.cancelled")}
                    count={orderStats.cancelled}
                    icon={XCircle}
                    color="text-red-600"
                    bgColor="bg-red-500/10"
                  />
                </div>
              </section>

              {/* Navigation Grid */}
              <section>
                <h2 className="text-lg font-semibold mb-4">
                  {t("navigation.title")}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {navigationCards.map((card) => (
                    <NavigationCard key={card.id} card={card} t={t} />
                  ))}
                </div>
              </section>

              {/* System Info */}
              <section className="text-center text-sm text-muted-foreground pt-4 border-t">
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <span>
                    {t("system.suppliers")}: <strong>{suppliers.length}</strong>
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span>
                    {t("system.version")}: <strong>0.5.0</strong>
                  </span>
                </div>
              </section>
            </div>
          </PageContentInner>
        </PageContent>
      </Page>
    </ProtectedRoute>
  );
}

// Status Card Component
interface StatusCardProps {
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

function StatusCard({
  label,
  count,
  icon: Icon,
  color,
  bgColor,
}: StatusCardProps) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg border ${bgColor}`}>
      <div className={`p-2 rounded-full ${bgColor}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold">{count}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// Navigation Card Component
interface NavigationCardProps {
  card: NavCard;
  t: (key: string) => string;
}

function NavigationCard({ card, t }: NavigationCardProps) {
  const Icon = card.icon;

  return (
    <Link to={card.href}>
      <Card className="group hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${card.bgColor}`}>
              <Icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div>
              <CardTitle className="text-base group-hover:text-primary transition-colors">
                {t(card.titleKey)}
              </CardTitle>
              <CardDescription className="text-sm">
                {t(card.descriptionKey)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
