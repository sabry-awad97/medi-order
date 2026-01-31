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
  Database,
  Trash2,
} from "lucide-react";
import { useTranslation } from "@meditrack/i18n";

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
  PageSection,
} from "@/components/ui/page";
import { Loading } from "@/components/ui/loading";
import { StatsCard } from "@/components/pharmacy/stats-card";
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  useSeedData,
  useClearData,
  useSettingValue,
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
  const { t } = useTranslation("suppliers");
  const { data: suppliers = [], isLoading } = useSuppliers();
  const seedData = useSeedData();
  const clearData = useClearData();

  // جلب الإعدادات
  const enableDevMode = useSettingValue<boolean>("enableDevMode", false);
  const requireSupplierEmail = useSettingValue<boolean>(
    "requireSupplierEmail",
    false,
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  // التحقق من وضع التطوير (من الإعدادات)
  const isDev = enableDevMode ?? import.meta.env.DEV;

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
    return <Loading icon={Users} message={t("loadingSuppliers")} />;
  }

  return (
    <Page>
      <PageHeader>
        <PageHeaderTrigger />
        <PageHeaderContent>
          <PageHeaderTitle>{t("title")}</PageHeaderTitle>
          <PageHeaderDescription>{t("description")}</PageHeaderDescription>
        </PageHeaderContent>
        <PageHeaderActions>
          {isDev && (
            <>
              <Button
                onClick={() => seedData.mutate()}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <Database className="h-5 w-5" />
                {t("testData")}
              </Button>
              {suppliers.length > 0 && (
                <Button
                  onClick={() => clearData.mutate()}
                  variant="outline"
                  size="lg"
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-5 w-5" />
                  {t("deleteAll")}
                </Button>
              )}
            </>
          )}
          <Button onClick={handleOpenCreateForm} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            {t("addSupplier")}
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <PageContent>
        <PageContentInner className="flex-1 flex flex-col min-h-0">
          {/* الإحصائيات */}
          {suppliers.length > 0 && (
            <PageSection className="mb-6 border-b-2 border-dashed pb-6 shrink-0">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                  title={t("stats.total")}
                  value={stats.total}
                  icon={Users}
                  color="bg-blue-500"
                />
                <StatsCard
                  title={t("stats.avgRating")}
                  value={stats.avgRating}
                  icon={Star}
                  color="bg-yellow-500"
                />
                <StatsCard
                  title={t("stats.avgDelivery")}
                  value={stats.avgDeliveryDays}
                  icon={TrendingUp}
                  color="bg-green-500"
                />
                <StatsCard
                  title={t("stats.totalOrders")}
                  value={stats.totalOrders}
                  icon={Package}
                  color="bg-purple-500"
                />
              </div>
            </PageSection>
          )}

          {/* البحث */}
          {suppliers.length > 0 && (
            <div className="relative w-full sm:w-80 mb-6 shrink-0">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 text-right"
              />
            </div>
          )}

          {/* قائمة الموردين */}
          <div className="flex-1 min-h-0">
            {filteredSuppliers.length === 0 ? (
              <div className="h-full flex items-center justify-center border border-dashed rounded-lg">
                <div className="text-center p-12">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    {searchQuery ? t("noSuppliersFound") : t("noSuppliers")}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery ? t("tryDifferentSearch") : t("startAdding")}
                  </p>
                  {!searchQuery && (
                    <Button onClick={handleOpenCreateForm} className="gap-2">
                      <Plus className="h-4 w-4" />
                      {t("addSupplier")}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full overflow-y-auto pb-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
          </div>
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
  const { t } = useTranslation("suppliers");

  return (
    <Card className="border border-dashed hover:border-solid hover:shadow-lg transition-all">
      <CardHeader className="border-b-2 border-dashed">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg">{supplier.name}</span>
          <Badge variant="outline" className="gap-1 border border-dashed">
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
            className="flex-1 gap-2 border border-dashed hover:border-solid"
            onClick={() => window.open(`tel:${supplier.phone}`)}
          >
            <Phone className="h-4 w-4" />
            {t("card.call")}
          </Button>
          {supplier.whatsapp && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-2 border border-dashed hover:border-solid"
              onClick={() =>
                window.open(
                  `https://wa.me/${supplier.whatsapp?.replace(/\D/g, "") || ""}`,
                )
              }
            >
              <MessageCircle className="h-4 w-4" />
              {t("card.whatsapp")}
            </Button>
          )}
          {supplier.email && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-2 border border-dashed hover:border-solid"
              onClick={() => window.open(`mailto:${supplier.email}`)}
            >
              <Mail className="h-4 w-4" />
              {t("card.email")}
            </Button>
          )}
        </div>

        {/* معلومات الأداء */}
        <div className="text-sm space-y-1 text-muted-foreground border border-dashed rounded-lg p-3">
          <p>📞 {supplier.phone}</p>
          <p>
            🚚{" "}
            {t("card.avgDeliveryDays", {
              days: supplier.avgDeliveryDays,
            })}
          </p>
          <p>📦 {t("card.orderCount", { count: supplier.totalOrders })}</p>
        </div>

        {/* الأدوية المتوفرة */}
        {supplier.commonMedicines.length > 0 && (
          <div className="border border-dashed rounded-lg p-3">
            <p className="text-sm font-medium mb-2">
              {t("card.availableMedicines")}
            </p>
            <div className="flex flex-wrap gap-1">
              {supplier.commonMedicines.slice(0, 3).map((med, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-xs border border-dashed"
                >
                  {med}
                </Badge>
              ))}
              {supplier.commonMedicines.length > 3 && (
                <Badge
                  variant="secondary"
                  className="text-xs border border-dashed"
                >
                  +{supplier.commonMedicines.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* ملاحظات */}
        {supplier.notes && (
          <div className="text-sm text-muted-foreground border-t border-dashed pt-3">
            <p className="font-medium mb-1">{t("card.notes")}</p>
            <p className="line-clamp-2">{supplier.notes}</p>
          </div>
        )}

        {/* أزرار التحكم */}
        <div className="flex gap-2 pt-2 border-t border-dashed">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onEdit(supplier)}
          >
            {t("card.edit")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-destructive hover:text-destructive"
            onClick={() => onDelete(supplier)}
          >
            {t("card.delete")}
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
  const { t } = useTranslation("suppliers");
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();

  // جلب الإعدادات
  const emailRequired = useSettingValue<boolean>("requireSupplierEmail", false);

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
        className="sm:max-w-3xl h-[90vh] flex flex-col p-0"
        dir="rtl"
      >
        <div className="p-4 border-b shrink-0">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {mode === "create" ? t("form.addTitle") : t("form.editTitle")}
            </DialogTitle>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* معلومات أساسية */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">{t("form.basicInfo")}</h3>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("form.supplierName")}{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder={t("form.supplierNamePlaceholder")}
                  className="text-right"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("form.phone")}{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <Input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder={t("form.phonePlaceholder")}
                    className="text-right"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("form.whatsapp")}
                  </label>
                  <Input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) =>
                      setFormData({ ...formData, whatsapp: e.target.value })
                    }
                    placeholder={t("form.phonePlaceholder")}
                    className="text-right"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("form.email")}{" "}
                  {emailRequired ? (
                    <span className="text-destructive">*</span>
                  ) : (
                    ""
                  )}
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder={t("form.emailPlaceholder")}
                  className="text-right"
                  dir="ltr"
                  required={emailRequired}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("form.address")}
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder={t("form.addressPlaceholder")}
                  className="text-right"
                />
              </div>
            </div>

            {/* الأدوية المتوفرة */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">
                {t("form.availableMedicines")}
              </h3>

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
                  placeholder={t("form.medicineName")}
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
                {t("form.notes")}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder={t("form.notesPlaceholder")}
                className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background text-right resize-none"
                dir="rtl"
              />
            </div>
          </div>

          {/* الأزرار */}
          <div className="p-4 border-t shrink-0">
            <div className="flex gap-3">
              <Button type="submit" className="flex-1">
                {mode === "create" ? t("form.submit") : t("form.update")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                {t("form.cancel")}
              </Button>
            </div>
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
  const { t } = useTranslation("suppliers");
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
          <AlertDialogTitle>{t("delete.title")}</AlertDialogTitle>
          <AlertDialogDescription className="text-right">
            {t("delete.description", { name: supplier?.name || "" })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel>{t("delete.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive hover:bg-destructive/90"
          >
            {t("delete.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
