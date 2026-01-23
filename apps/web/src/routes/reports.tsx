import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  TrendingUp,
  Package,
  Users,
  Clock,
  CheckCircle,
  Calendar,
  Award,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { useOrders, useSuppliers } from "@/hooks";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { data: suppliers = [], isLoading: suppliersLoading } = useSuppliers();

  // حساب الإحصائيات
  const stats = useMemo(() => {
    if (orders.length === 0) {
      return {
        topMedicines: [],
        avgDeliveryTime: 0,
        ordersByMonth: {},
        ordersByStatus: {
          pending: 0,
          ordered: 0,
          arrived: 0,
          delivered: 0,
          cancelled: 0,
        },
        totalMedicines: 0,
        completionRate: 0,
        topSuppliers: [],
      };
    }

    // الأدوية الأكثر طلباً
    const medicineCount: Record<string, number> = {};
    orders.forEach((order) => {
      order.medicines.forEach((med) => {
        const key = med.name;
        medicineCount[key] = (medicineCount[key] || 0) + med.quantity;
      });
    });

    const topMedicines = Object.entries(medicineCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // متوسط وقت التسليم
    const deliveredOrders = orders.filter((o) => o.status === "delivered");
    const avgDeliveryTime =
      deliveredOrders.length > 0
        ? deliveredOrders.reduce((sum, order) => {
            const days =
              (order.updatedAt.getTime() - order.createdAt.getTime()) /
              (1000 * 60 * 60 * 24);
            return sum + days;
          }, 0) / deliveredOrders.length
        : 0;

    // الطلبات حسب الشهر
    const ordersByMonth: Record<string, number> = {};
    orders.forEach((order) => {
      const month = order.createdAt.toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
      });
      ordersByMonth[month] = (ordersByMonth[month] || 0) + 1;
    });

    // الطلبات حسب الحالة
    const ordersByStatus = {
      pending: orders.filter((o) => o.status === "pending").length,
      ordered: orders.filter((o) => o.status === "ordered").length,
      arrived: orders.filter((o) => o.status === "arrived").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    };

    // إجمالي الأدوية
    const totalMedicines = orders.reduce(
      (sum, order) => sum + order.medicines.reduce((s, m) => s + m.quantity, 0),
      0,
    );

    // معدل الإنجاز
    const completionRate =
      orders.length > 0
        ? Math.round((deliveredOrders.length / orders.length) * 100)
        : 0;

    // أفضل الموردين (حسب التقييم)
    const topSuppliers = suppliers
      .sort((a, b) => {
        const scoreA = a.rating * 0.6 + (10 - a.avgDeliveryDays) * 0.4;
        const scoreB = b.rating * 0.6 + (10 - b.avgDeliveryDays) * 0.4;
        return scoreB - scoreA;
      })
      .slice(0, 5);

    return {
      topMedicines,
      avgDeliveryTime: Math.round(avgDeliveryTime * 10) / 10,
      ordersByMonth,
      ordersByStatus,
      totalMedicines,
      completionRate,
      topSuppliers,
    };
  }, [orders, suppliers]);

  if (ordersLoading || suppliersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] py-16">
        <div className="text-center border-2 border-dashed rounded-lg p-12">
          <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4 animate-pulse" />
          <p className="text-muted-foreground">جاري تحميل التقارير...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col h-full w-full" dir="rtl">
        <div className="flex-1 flex flex-col min-h-0 container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8 shrink-0">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              التقارير والإحصائيات
            </h1>
            <p className="text-muted-foreground">
              تحليل شامل لأداء الطلبات الخاصة
            </p>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <Empty className="border-2 border-dashed rounded-lg p-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BarChart3 className="h-8 w-8" />
                </EmptyMedia>
                <EmptyTitle>لا توجد بيانات للتقارير</EmptyTitle>
                <EmptyDescription>
                  ابدأ بإضافة طلبات لعرض التقارير والإحصائيات
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full" dir="rtl">
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* الرأس */}
          <div className="mb-8 border-b-2 border-dashed pb-6">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              التقارير والإحصائيات
            </h1>
            <p className="text-muted-foreground">
              تحليل شامل لأداء الطلبات الخاصة
            </p>
          </div>

          {/* الإحصائيات الرئيسية */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  إجمالي الطلبات
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orders.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalMedicines} دواء إجمالاً
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  متوسط وقت التسليم
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.avgDeliveryTime} أيام
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  للطلبات المكتملة
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  معدل الإنجاز
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.completionRate}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.ordersByStatus.delivered} من {orders.length} طلب
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  عدد الموردين
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{suppliers.length}</div>
                <p className="text-xs text-muted-foreground mt-1">مورد نشط</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mb-8">
            {/* الأدوية الأكثر طلباً */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  الأدوية الأكثر طلباً
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.topMedicines.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    لا توجد بيانات
                  </p>
                ) : (
                  <div className="space-y-4">
                    {stats.topMedicines.map((med, index) => (
                      <div key={med.name} className="flex items-center gap-4">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{med.name}</p>
                          <div className="w-full bg-muted rounded-full h-2 mt-1">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{
                                width: `${(med.count / stats.topMedicines[0].count) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="shrink-0 text-sm font-medium">
                          {med.count} طلب
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* الطلبات حسب الحالة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  الطلبات حسب الحالة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <StatusBar
                    label="قيد الانتظار"
                    count={stats.ordersByStatus.pending}
                    total={orders.length}
                    color="bg-yellow-500"
                  />
                  <StatusBar
                    label="تم الطلب"
                    count={stats.ordersByStatus.ordered}
                    total={orders.length}
                    color="bg-purple-500"
                  />
                  <StatusBar
                    label="وصل"
                    count={stats.ordersByStatus.arrived}
                    total={orders.length}
                    color="bg-green-500"
                  />
                  <StatusBar
                    label="تم التسليم"
                    count={stats.ordersByStatus.delivered}
                    total={orders.length}
                    color="bg-blue-500"
                  />
                  <StatusBar
                    label="ملغي"
                    count={stats.ordersByStatus.cancelled}
                    total={orders.length}
                    color="bg-gray-500"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* الطلبات حسب الشهر */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  الطلبات حسب الشهر
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(stats.ordersByMonth).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    لا توجد بيانات
                  </p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(stats.ordersByMonth)
                      .sort(([a], [b]) => b.localeCompare(a))
                      .slice(0, 6)
                      .map(([month, count]) => (
                        <div
                          key={month}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm font-medium">{month}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{
                                  width: `${(count / Math.max(...Object.values(stats.ordersByMonth))) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-bold w-12 text-left">
                              {count}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* أفضل الموردين */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  أفضل الموردين
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.topSuppliers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    لا يوجد موردين
                  </p>
                ) : (
                  <div className="space-y-4">
                    {stats.topSuppliers.map((supplier, index) => (
                      <div
                        key={supplier.id}
                        className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {supplier.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              ⭐ {supplier.rating}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {supplier.avgDeliveryDays} أيام
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 text-sm text-muted-foreground">
                          {supplier.totalOrders} طلب
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* إحصائيات إضافية */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>ملخص الأداء</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    الطلبات النشطة
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.ordersByStatus.pending +
                      stats.ordersByStatus.ordered +
                      stats.ordersByStatus.arrived}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    قيد المعالجة حالياً
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    الطلبات المكتملة
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.ordersByStatus.delivered}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    تم تسليمها بنجاح
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    الطلبات الملغاة
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.ordersByStatus.cancelled}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {orders.length > 0
                      ? Math.round(
                          (stats.ordersByStatus.cancelled / orders.length) *
                            100,
                        )
                      : 0}
                    % من الإجمالي
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// مكون شريط الحالة
interface StatusBarProps {
  label: string;
  count: number;
  total: number;
  color: string;
}

function StatusBar({ label, count, total, color }: StatusBarProps) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">
          {count} ({percentage}%)
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
