import { useState, useMemo } from "react";
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
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderCard } from "@/components/pharmacy/order-card";
import { OrderForm } from "@/components/pharmacy/order-form";
import { OrderViewDialog } from "@/components/pharmacy/order-view-dialog";
import { StatusChangeDialog } from "@/components/pharmacy/status-change-dialog";
import { StatsCard } from "@/components/pharmacy/stats-card";
import type { Order, OrderFormData, OrderStatus } from "@/lib/types";

export const Route = createFileRoute("/pharmacy")({
  component: PharmacyComponent,
});

// بيانات تجريبية للعرض
const MOCK_ORDERS: Order[] = [
  {
    id: "1",
    customerName: "أحمد محمد العلي",
    phoneNumber: "0501234567",
    status: "pending",
    medicines: [
      {
        id: "m1",
        name: "Panadol Extra",
        concentration: "500mg",
        form: "أقراص",
        quantity: 2,
      },
      {
        id: "m2",
        name: "Augmentin",
        concentration: "1g",
        form: "أقراص",
        quantity: 1,
      },
    ],
    notes: "يفضل التوصيل قبل المساء",
    createdAt: new Date("2024-01-20T10:30:00"),
    updatedAt: new Date("2024-01-20T10:30:00"),
  },
  {
    id: "2",
    customerName: "فاطمة أحمد",
    phoneNumber: "0559876543",
    status: "ordered",
    medicines: [
      {
        id: "m3",
        name: "Ventolin Inhaler",
        concentration: "100mcg",
        form: "بخاخ",
        quantity: 1,
      },
    ],
    notes: "",
    createdAt: new Date("2024-01-19T14:20:00"),
    updatedAt: new Date("2024-01-19T14:20:00"),
  },
  {
    id: "3",
    customerName: "خالد عبدالله",
    phoneNumber: "0505555555",
    status: "arrived",
    medicines: [
      {
        id: "m4",
        name: "Lipitor",
        concentration: "20mg",
        form: "أقراص",
        quantity: 3,
      },
      {
        id: "m5",
        name: "Aspirin",
        concentration: "100mg",
        form: "أقراص",
        quantity: 2,
      },
    ],
    notes: "عميل دائم",
    createdAt: new Date("2024-01-18T09:15:00"),
    updatedAt: new Date("2024-01-18T09:15:00"),
  },
];

function PharmacyComponent() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
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
        statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // إضافة طلب جديد
  const handleCreateOrder = (data: OrderFormData) => {
    const newOrder: Order = {
      id: crypto.randomUUID(),
      customerName: data.customerName,
      phoneNumber: data.phoneNumber,
      medicines: data.medicines.map((m) => ({
        ...m,
        id: crypto.randomUUID(),
      })),
      status: "pending",
      notes: data.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setOrders([newOrder, ...orders]);
    toast.success("تم إضافة الطلب بنجاح");
  };

  // تعديل طلب
  const handleEditOrder = (data: OrderFormData) => {
    if (!selectedOrder) return;

    setOrders(
      orders.map((order) =>
        order.id === selectedOrder.id
          ? {
              ...order,
              customerName: data.customerName,
              phoneNumber: data.phoneNumber,
              medicines: data.medicines.map((m) => ({
                ...m,
                id: crypto.randomUUID(),
              })),
              notes: data.notes,
              updatedAt: new Date(),
            }
          : order,
      ),
    );

    toast.success("تم تحديث الطلب بنجاح");
  };

  // تغيير حالة الطلب
  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId
          ? { ...order, status: newStatus, updatedAt: new Date() }
          : order,
      ),
    );

    toast.success("تم تغيير حالة الطلب بنجاح");
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

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* الرأس */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                الطلبات الخاصة
              </h1>
              <p className="text-muted-foreground">
                إدارة طلبات الأدوية الخاصة للصيدلية
              </p>
            </div>
            <Button onClick={handleOpenCreateForm} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              إضافة طلب جديد
            </Button>
          </div>

          {/* الإحصائيات */}
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
        </div>

        {/* البحث والتصفية */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
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
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as OrderStatus | "all")
            }
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

        {/* قائمة الطلبات */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16">
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
        ) : (
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
        )}
      </div>

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
    </div>
  );
}
