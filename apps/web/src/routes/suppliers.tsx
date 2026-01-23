import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Plus,
  Phone,
  MessageCircle,
  Mail,
  Package,
  Search,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/page";
import { Loading } from "@/components/ui/loading";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from "@/hooks";
import type { Supplier, SupplierFormData } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/suppliers")({
  component: SuppliersPage,
});

function SuppliersPage() {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  // تصفية الموردين
  const filteredSuppliers = useMemo(() => {
    if (!searchQuery) return suppliers;

    return suppliers.filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.phone.includes(searchQuery) ||
        supplier.commonMedicines.some((med) =>
          med.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );
  }, [suppliers, searchQuery]);

  // حساب الإحصائيات
  const stats = useMemo(() => {
    if (suppliers.length === 0) {
      return {
        total: 0,
        avgRating: 0,
        avgDeliveryDays: 0,
        totalOrders: 0,
      };
    }

    const totalRating = suppliers.reduce((sum, s) => sum + s.rating, 0);
    const totalDeliveryDays = suppliers.reduce(
      (sum, s) => sum + s.avgDeliveryDays,
      0,
    );
    const totalOrders = suppliers.reduce((sum, s) => sum + s.totalOrders, 0);

    return {
      total: suppliers.length,
      avgRating: Math.round((totalRating / suppliers.length) * 10) / 10,
      avgDeliveryDays:
        Math.round((totalDeliveryDays / suppliers.length) * 10) / 10,
      totalOrders,
    };
  }, [suppliers]);

  const handleOpenCreateForm = () => {
    setSelectedSupplier(null);
    setFormMode("create");
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormMode("edit");
    setIsFormOpen(true);
  };

  const handleOpenDelete = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsDeleteOpen(true);
  };

  if (isLoading) {
    return <Loading icon={Users} message="جاري تحميل الموردين..." />;
  }

  return (
    <Page>
      <PageHeader>
        <PageHeaderTrigger />
        <PageHeaderContent>
          <PageHeaderTitle>الموردين</PageHeaderTitle>
          <PageHeaderDescription>
            إدارة قائمة الموردين والتواصل معهم
          </PageHeaderDescription>
        </PageHeaderContent>
        <PageHeaderActions>
          <Button onClick={handleOpenCreateForm} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            إضافة مورد جديد
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <PageContent>
        <PageContentInner className="flex-1 flex flex-col min-h-0">
          {/* الإحصائيات */}
          {suppliers.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6 shrink-0">
              <Card className="border-2 border-dashed hover:border-solid transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    إجمالي الموردين
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card className="border-2 border-dashed hover:border-solid transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    متوسط التقييم
                  </CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.avgRating} / 5
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-dashed hover:border-solid transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    متوسط التوصيل
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.avgDeliveryDays} أيام
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-dashed hover:border-solid transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    إجمالي الطلبات
                  </CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOrders}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* البحث */}
          {suppliers.length > 0 && (
            <div className="relative mb-6 shrink-0">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث باسم المورد أو رقم الهاتف أو الدواء..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 text-right border-2 border-dashed focus:border-solid"
              />
            </div>
          )}

          {/* قائمة الموردين */}
          {filteredSuppliers.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <Empty className="border-2 border-dashed rounded-lg p-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Package className="h-8 w-8" />
                  </EmptyMedia>
                  <EmptyTitle>
                    {searchQuery
                      ? "لم يتم العثور على موردين"
                      : "لا يوجد موردين"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {searchQuery
                      ? "جرب البحث بكلمات مختلفة"
                      : "ابدأ بإضافة مورد جديد لإدارة الطلبات الخاصة"}
                  </EmptyDescription>
                </EmptyHeader>
                {!searchQuery && (
                  <EmptyContent>
                    <Button onClick={handleOpenCreateForm} className="gap-2">
                      <Plus className="h-4 w-4" />
                      إضافة مورد جديد
                    </Button>
                  </EmptyContent>
                )}
              </Empty>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pb-4">
                {filteredSuppliers.map((supplier) => (
                  <SupplierCard
                    key={supplier.id}
                    supplier={supplier}
                    onEdit={handleOpenEditForm}
                    onDelete={handleOpenDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </PageContentInner>
      </PageContent>

      {/* نموذج إضافة/تعديل */}
      <SupplierFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        supplier={selectedSupplier}
        mode={formMode}
      />

      {/* تأكيد الحذف */}
      <DeleteSupplierDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        supplier={selectedSupplier}
      />
    </Page>
  );
}

// مكون بطاقة المورد
interface SupplierCardProps {
  supplier: Supplier;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
}

function SupplierCard({ supplier, onEdit, onDelete }: SupplierCardProps) {
  return (
    <Card className="border-2 border-dashed hover:border-solid hover:shadow-lg transition-all">
      <CardHeader className="border-b-2 border-dashed">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg">{supplier.name}</span>
          <Badge variant="outline" className="gap-1 border-2 border-dashed">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {supplier.rating}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* أزرار الاتصال */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-2 border-2 border-dashed hover:border-solid"
            onClick={() => window.open(`tel:${supplier.phone}`)}
          >
            <Phone className="h-4 w-4" />
            اتصال
          </Button>
          {supplier.whatsapp && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-2 border-2 border-dashed hover:border-solid"
              onClick={() =>
                window.open(
                  `https://wa.me/${supplier.whatsapp?.replace(/\D/g, "") || ""}`,
                )
              }
            >
              <MessageCircle className="h-4 w-4" />
              واتساب
            </Button>
          )}
          {supplier.email && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-2 border-2 border-dashed hover:border-solid"
              onClick={() => window.open(`mailto:${supplier.email}`)}
            >
              <Mail className="h-4 w-4" />
              بريد
            </Button>
          )}
        </div>

        {/* معلومات الأداء */}
        <div className="text-sm space-y-1 text-muted-foreground border-2 border-dashed rounded-lg p-3">
          <p>📞 {supplier.phone}</p>
          <p>🚚 متوسط التوصيل: {supplier.avgDeliveryDays} أيام</p>
          <p>📦 عدد الطلبات: {supplier.totalOrders}</p>
        </div>

        {/* الأدوية المتوفرة */}
        {supplier.commonMedicines.length > 0 && (
          <div className="border-2 border-dashed rounded-lg p-3">
            <p className="text-sm font-medium mb-2">الأدوية المتوفرة:</p>
            <div className="flex flex-wrap gap-1">
              {supplier.commonMedicines.slice(0, 3).map((med, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-xs border-2 border-dashed"
                >
                  {med}
                </Badge>
              ))}
              {supplier.commonMedicines.length > 3 && (
                <Badge
                  variant="secondary"
                  className="text-xs border-2 border-dashed"
                >
                  +{supplier.commonMedicines.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* ملاحظات */}
        {supplier.notes && (
          <div className="text-sm text-muted-foreground border-t-2 border-dashed pt-3">
            <p className="font-medium mb-1">ملاحظات:</p>
            <p className="line-clamp-2">{supplier.notes}</p>
          </div>
        )}

        {/* أزرار التحكم */}
        <div className="flex gap-2 pt-2 border-t-2 border-dashed">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onEdit(supplier)}
          >
            تعديل
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-destructive hover:text-destructive"
            onClick={() => onDelete(supplier)}
          >
            حذف
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// نموذج إضافة/تعديل المورد
interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  mode: "create" | "edit";
}

function SupplierFormDialog({
  open,
  onOpenChange,
  supplier,
  mode,
}: SupplierFormDialogProps) {
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();

  const [formData, setFormData] = useState<SupplierFormData>({
    name: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    commonMedicines: [],
    notes: "",
  });

  const [medicineInput, setMedicineInput] = useState("");

  // تحديث البيانات عند فتح النموذج
  useMemo(() => {
    if (open && supplier && mode === "edit") {
      setFormData({
        name: supplier.name,
        phone: supplier.phone,
        whatsapp: supplier.whatsapp || "",
        email: supplier.email || "",
        address: supplier.address || "",
        commonMedicines: supplier.commonMedicines,
        notes: supplier.notes,
      });
    } else if (open && mode === "create") {
      setFormData({
        name: "",
        phone: "",
        whatsapp: "",
        email: "",
        address: "",
        commonMedicines: [],
        notes: "",
      });
      setMedicineInput("");
    }
  }, [open, supplier, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "create") {
      createSupplier.mutate(formData);
    } else if (supplier) {
      updateSupplier.mutate({ id: supplier.id, data: formData });
    }

    onOpenChange(false);
  };

  const handleAddMedicine = () => {
    if (medicineInput.trim()) {
      setFormData({
        ...formData,
        commonMedicines: [...formData.commonMedicines, medicineInput.trim()],
      });
      setMedicineInput("");
    }
  };

  const handleRemoveMedicine = (index: number) => {
    setFormData({
      ...formData,
      commonMedicines: formData.commonMedicines.filter((_, i) => i !== index),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {mode === "create" ? "إضافة مورد جديد" : "تعديل المورد"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* معلومات أساسية */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">المعلومات الأساسية</h3>

            <div>
              <label className="block text-sm font-medium mb-2">
                اسم المورد <span className="text-destructive">*</span>
              </label>
              <Input
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="مثال: شركة الدواء المتحدة"
                className="text-right"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  رقم الهاتف <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="05xxxxxxxx"
                  className="text-right"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  واتساب (اختياري)
                </label>
                <Input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsapp: e.target.value })
                  }
                  placeholder="05xxxxxxxx"
                  className="text-right"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                البريد الإلكتروني (اختياري)
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="example@company.com"
                className="text-right"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                العنوان (اختياري)
              </label>
              <Input
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="الرياض، حي النخيل"
                className="text-right"
              />
            </div>
          </div>

          {/* الأدوية المتوفرة */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">الأدوية المتوفرة</h3>

            <div className="flex gap-2">
              <Input
                value={medicineInput}
                onChange={(e) => setMedicineInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddMedicine();
                  }
                }}
                placeholder="اسم الدواء"
                className="text-right flex-1"
              />
              <Button
                type="button"
                onClick={handleAddMedicine}
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {formData.commonMedicines.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.commonMedicines.map((med, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="gap-2 cursor-pointer hover:bg-destructive/10"
                    onClick={() => handleRemoveMedicine(index)}
                  >
                    {med}
                    <span className="text-destructive">×</span>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* ملاحظات */}
          <div>
            <label className="block text-sm font-medium mb-2">
              ملاحظات (اختياري)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="أي ملاحظات إضافية عن المورد..."
              className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background text-right resize-none"
              dir="rtl"
            />
          </div>

          {/* الأزرار */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {mode === "create" ? "إضافة المورد" : "حفظ التعديلات"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// نافذة تأكيد الحذف
interface DeleteSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
}

function DeleteSupplierDialog({
  open,
  onOpenChange,
  supplier,
}: DeleteSupplierDialogProps) {
  const deleteSupplier = useDeleteSupplier();

  const handleDelete = () => {
    if (supplier) {
      deleteSupplier.mutate(supplier.id);
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>تأكيد حذف المورد</AlertDialogTitle>
          <AlertDialogDescription className="text-right">
            هل أنت متأكد من حذف المورد "{supplier?.name}"؟ لا يمكن التراجع عن
            هذا الإجراء.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive hover:bg-destructive/90"
          >
            حذف
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
