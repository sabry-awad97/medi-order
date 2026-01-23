import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Phone, Calendar, Package } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { Order } from "@/lib/types";

import { StatusBadge } from "./status-badge";

interface OrderViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

export function OrderViewDialog({
  open,
  onOpenChange,
  order,
}: OrderViewDialogProps) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col p-0">
        <div className="p-4 border-b shrink-0">
          <DialogHeader>
            <DialogTitle className="text-2xl">تفاصيل الطلب</DialogTitle>
            <DialogDescription>معلومات كاملة عن الطلب</DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* معلومات العميل */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              معلومات العميل
            </h3>
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">الاسم:</span>
                <span className="font-medium">{order.customerName}</span>
              </div>
              {order.phoneNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">رقم الهاتف:</span>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span dir="ltr" className="font-medium">
                      {order.phoneNumber}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">الحالة:</span>
                <StatusBadge status={order.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">
                    {format(order.createdAt, "d MMMM yyyy - h:mm a", {
                      locale: ar,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* الأدوية */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">الأدوية المطلوبة</h3>
            <div className="space-y-2">
              {order.medicines.map((medicine, index) => (
                <div
                  key={medicine.id}
                  className="p-4 rounded-lg border bg-card space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          #{index + 1}
                        </span>
                        <h4 className="font-semibold text-lg">
                          {medicine.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>
                          التركيز: {medicine.concentration || "غير محدد"}
                        </span>
                        <span>•</span>
                        <span>الشكل: {medicine.form}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        ×{medicine.quantity}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        الكمية
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* الملاحظات */}
          {order.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">ملاحظات الصيدلي</h3>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-foreground whitespace-pre-wrap">
                    {order.notes}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
