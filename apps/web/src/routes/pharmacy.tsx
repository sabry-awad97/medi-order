import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Plus,
  Search,
  Package,
  Clock,
  CheckCircle,
  TruckIcon,
  ListOrdered,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Page,
  PageHeader,
  PageHeaderTrigger,
  PageHeaderContent,
  PageHeaderTitle,
  PageHeaderDescription,
  PageHeaderActions,
  PageContent,
  PageContentInner,
  PageSection,
  PageSectionHeader,
  PageSectionContent,
} from "@/components/ui/page";
import { OrderCard } from "@/components/pharmacy/order-card";
import { OrderForm } from "@/components/pharmacy/order-form";
import { OrderViewDialog } from "@/components/pharmacy/order-view-dialog";
import { StatusChangeDialog } from "@/components/pharmacy/status-change-dialog";
import { StatsCard } from "@/components/pharmacy/stats-card";
import {
  useOrders,
  useCreateOrder,
  useUpdateOrder,
  useUpdateOrderStatus,
  useOrderAlerts,
} from "@/hooks";
import type { Order, OrderFormData, OrderStatus } from "@/lib/types";

export const Route = createFileRoute("/pharmacy")({
  component: PharmacyComponent,
});

function PharmacyComponent() {
  // استخدام TanStack Query بدلاً من useState
  const { data: orders = [], isLoading } = useOrders();
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const updateOrderStatus = useUpdateOrderStatus();

  // تفعيل التنبيهات التلقائية
  useOrderAlerts();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all" | null>(
    null,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isStatusChangeOpen, setIsStatusChangeOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  // حساب الإحصائيات
  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      ordered: orders.filter((o) => o.status === "ordered").length,
      arrived: orders.filter((o) => o.status === "arrived").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
    };
  }, [orders]);

  // تصفية الطلبات
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.medicines.some((m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()),
        );

      const matchesStatus =
        !statusFilter ||
        statusFilter === "all" ||
        order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // إضافة طلب جديد
  const handleCreateOrder = (data: OrderFormData) => {
    createOrder.mutate(data);
    setIsFormOpen(false);
  };

  // تعديل طلب
  const handleEditOrder = (data: OrderFormData) => {
    if (!selectedOrder) return;
    updateOrder.mutate({ id: selectedOrder.id, data });
    setIsFormOpen(false);
  };

  // تغيير حالة الطلب
  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus.mutate({ id: orderId, status: newStatus });
    setIsStatusChangeOpen(false);
  };

  // فتح نموذج إضافة طلب
  const handleOpenCreateForm = () => {
    setSelectedOrder(null);
    setFormMode("create");
    setIsFormOpen(true);
  };

  // فتح نموذج تعديل طلب
  const handleOpenEditForm = (order: Order) => {
    setSelectedOrder(order);
    setFormMode("edit");
    setIsFormOpen(true);
  };

  // عرض تفاصيل الطلب
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsViewOpen(true);
  };

  // فتح نافذة تغيير الحالة
  const handleOpenStatusChange = (order: Order) => {
    setSelectedOrder(order);
    setIsStatusChangeOpen(true);
  };

  // عرض loader أثناء التحميل
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] py-16">
        <div className="text-center border-2 border-dashed rounded-lg p-12">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4 animate-pulse" />
          <p className="text-muted-foreground">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  return (
    <Page>
      <PageHeader>
        <PageHeaderTrigger />
        <PageHeaderContent>
          <PageHeaderTitle>الطلبات الخاصة</PageHeaderTitle>
          <PageHeaderDescription>
            إدارة طلبات الأدوية الخاصة للصيدلية
          </PageHeaderDescription>
        </PageHeaderContent>
        <PageHeaderActions>
          <Button
            onClick={handleOpenCreateForm}
            size="lg"
            className="gap-2 rounded-md"
          >
            <Plus className="h-5 w-5" />
            إضافة طلب جديد
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <PageContent>
        <PageContentInner className="flex-1 flex flex-col min-h-0">
          {/* الإحصائيات */}
          <PageSection className="mb-6 border-b-2 border-dashed pb-6 shrink-0">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <StatsCard
                title="إجمالي الطلبات"
                value={stats.total}
                icon={ListOrdered}
                color="bg-blue-500"
              />
              <StatsCard
                title="قيد الانتظار"
                value={stats.pending}
                icon={Clock}
                color="bg-yellow-500"
              />
              <StatsCard
                title="تم الطلب"
                value={stats.ordered}
                icon={Package}
                color="bg-purple-500"
              />
              <StatsCard
                title="وصل"
                value={stats.arrived}
                icon={TruckIcon}
                color="bg-green-500"
              />
              <StatsCard
                title="تم التسليم"
                value={stats.delivered}
                icon={CheckCircle}
                color="bg-gray-500"
              />
            </div>
          </PageSection>

          {/* البحث والتصفية */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث باسم العميل أو الدواء..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 text-right"
              />
            </div>
            <Select
              items={[
                { value: null, label: "تصفية حسب الحالة" },
                { value: "all", label: "جميع الحالات" },
                { value: "pending", label: "قيد الانتظار" },
                { value: "ordered", label: "تم الطلب" },
                { value: "arrived", label: "وصل" },
                { value: "delivered", label: "تم التسليم" },
                { value: "cancelled", label: "ملغي" },
              ]}
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full sm:w-[200px] text-right">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="ordered">تم الطلب</SelectItem>
                <SelectItem value="arrived">وصل</SelectItem>
                <SelectItem value="delivered">تم التسليم</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* قائمة الطلبات مع ScrollArea */}
          <div className="flex-1 min-h-0">
            {filteredOrders.length === 0 ? (
              <div className="h-full flex items-center justify-center border border-dashed rounded-lg">
                <div className="text-center p-12">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">لا توجد طلبات</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery || statusFilter !== "all"
                      ? "لم يتم العثور على طلبات مطابقة للبحث"
                      : "ابدأ بإضافة طلب جديد"}
                  </p>
                  {!searchQuery && statusFilter === "all" && (
                    <Button onClick={handleOpenCreateForm} className="gap-2">
                      <Plus className="h-4 w-4" />
                      إضافة طلب جديد
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full overflow-y-auto pb-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onView={handleViewOrder}
                      onEdit={handleOpenEditForm}
                      onStatusChange={handleOpenStatusChange}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </PageContentInner>
      </PageContent>

      {/* النوافذ المنبثقة */}
      <OrderForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={formMode === "create" ? handleCreateOrder : handleEditOrder}
        initialData={
          formMode === "edit" ? selectedOrder || undefined : undefined
        }
        mode={formMode}
      />

      <OrderViewDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        order={selectedOrder}
      />

      <StatusChangeDialog
        open={isStatusChangeOpen}
        onOpenChange={setIsStatusChangeOpen}
        order={selectedOrder}
        onConfirm={handleStatusChange}
      />
    </Page>
  );
}
