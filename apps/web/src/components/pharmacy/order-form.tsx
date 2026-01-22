import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MEDICINE_FORMS } from "@/lib/constants";
import type { Order, OrderFormData } from "@/lib/types";

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: OrderFormData) => void;
  initialData?: Order;
  mode: "create" | "edit";
}

interface MedicineInput {
  tempId: string;
  name: string;
  concentration: string;
  form: string;
  quantity: string;
}

export function OrderForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
}: OrderFormProps) {
  const [customerName, setCustomerName] = useState(
    initialData?.customerName || "",
  );
  const [phoneNumber, setPhoneNumber] = useState(
    initialData?.phoneNumber || "",
  );
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [medicines, setMedicines] = useState<MedicineInput[]>(
    initialData?.medicines.map((m) => ({
      tempId: m.id,
      name: m.name,
      concentration: m.concentration,
      form: m.form,
      quantity: m.quantity.toString(),
    })) || [
      {
        tempId: crypto.randomUUID(),
        name: "",
        concentration: "",
        form: "",
        quantity: "1",
      },
    ],
  );

  const handleAddMedicine = () => {
    setMedicines([
      ...medicines,
      {
        tempId: crypto.randomUUID(),
        name: "",
        concentration: "",
        form: "",
        quantity: "1",
      },
    ]);
  };

  const handleRemoveMedicine = (tempId: string) => {
    if (medicines.length > 1) {
      setMedicines(medicines.filter((m) => m.tempId !== tempId));
    }
  };

  const handleMedicineChange = (
    tempId: string,
    field: keyof MedicineInput,
    value: string,
  ) => {
    setMedicines(
      medicines.map((m) =>
        m.tempId === tempId ? { ...m, [field]: value } : m,
      ),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData: OrderFormData = {
      customerName,
      phoneNumber,
      notes,
      medicines: medicines
        .filter((m) => m.name.trim() !== "")
        .map((m) => ({
          name: m.name,
          concentration: m.concentration,
          form: m.form,
          quantity: parseInt(m.quantity) || 1,
        })),
    };

    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setCustomerName("");
    setPhoneNumber("");
    setNotes("");
    setMedicines([
      {
        tempId: crypto.randomUUID(),
        name: "",
        concentration: "",
        form: "",
        quantity: "1",
      },
    ]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {mode === "create" ? "إضافة طلب جديد" : "تعديل الطلب"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "أدخل بيانات العميل والأدوية المطلوبة"
              : "قم بتعديل بيانات الطلب"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* بيانات العميل */}
          <div className="space-y-4 p-4 rounded-lg bg-muted/50">
            <h3 className="font-semibold text-lg">بيانات العميل</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerName">اسم العميل *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="أدخل اسم العميل"
                  required
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">رقم الهاتف</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="05xxxxxxxx"
                  dir="ltr"
                  className="text-left"
                />
              </div>
            </div>
          </div>

          {/* الأدوية المطلوبة */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">الأدوية المطلوبة</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddMedicine}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                إضافة دواء
              </Button>
            </div>

            <div className="space-y-3">
              {medicines.map((medicine, index) => (
                <div
                  key={medicine.tempId}
                  className="p-4 rounded-lg border bg-card space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      دواء {index + 1}
                    </span>
                    {medicines.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMedicine(medicine.tempId)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2 sm:col-span-2">
                      <Label>اسم الدواء *</Label>
                      <Input
                        value={medicine.name}
                        onChange={(e) =>
                          handleMedicineChange(
                            medicine.tempId,
                            "name",
                            e.target.value,
                          )
                        }
                        placeholder="مثال: Panadol Extra"
                        required
                        className="text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>التركيز</Label>
                      <Input
                        value={medicine.concentration}
                        onChange={(e) =>
                          handleMedicineChange(
                            medicine.tempId,
                            "concentration",
                            e.target.value,
                          )
                        }
                        placeholder="مثال: 500mg"
                        className="text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الكمية *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={medicine.quantity}
                        onChange={(e) =>
                          handleMedicineChange(
                            medicine.tempId,
                            "quantity",
                            e.target.value,
                          )
                        }
                        required
                        className="text-center"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>الشكل الصيدلي *</Label>
                    <Select
                      value={medicine.form || undefined}
                      onValueChange={(value) =>
                        handleMedicineChange(
                          medicine.tempId,
                          "form",
                          value || "",
                        )
                      }
                    >
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="اختر الشكل الصيدلي" />
                      </SelectTrigger>
                      <SelectContent>
                        {MEDICINE_FORMS.map((form) => (
                          <SelectItem key={form} value={form}>
                            {form}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ملاحظات */}
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات الصيدلي</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي ملاحظات إضافية..."
              rows={3}
              className="text-right resize-none"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 ml-2" />
              إلغاء
            </Button>
            <Button type="submit">
              {mode === "create" ? "حفظ الطلب" : "تحديث الطلب"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
