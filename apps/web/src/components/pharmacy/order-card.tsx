import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Eye, Pencil, RefreshCw, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Order } from "@/lib/types";

import { StatusBadge } from "./status-badge";

interface OrderCardProps {
  order: Order;
  onView: (order: Order) => void;
  onEdit: (order: Order) => void;
  onStatusChange: (order: Order) => void;
}

export function OrderCard({
  order,
  onView,
  onEdit,
  onStatusChange,
}: OrderCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground truncate">
              {order.customerName}
            </h3>
            {order.phoneNumber && (
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span dir="ltr">{order.phoneNumber}</span>
              </div>
            )}
          </div>
          <StatusBadge status={order.status} />
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            الأدوية المطلوبة:
          </h4>
          <div className="space-y-2">
            {order.medicines.map((medicine) => (
              <div
                key={medicine.id}
                className="flex items-start justify-between gap-3 p-2 rounded-md bg-muted/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{medicine.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {medicine.concentration} • {medicine.form}
                  </p>
                </div>
                <div className="shrink-0 text-sm font-semibold">
                  ×{medicine.quantity}
                </div>
              </div>
            ))}
          </div>
        </div>

        {order.notes && (
          <>
            <Separator className="my-3" />
            <div className="text-sm">
              <span className="font-medium text-muted-foreground">
                ملاحظات:{" "}
              </span>
              <span className="text-foreground">{order.notes}</span>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-3 border-t">
        <div className="text-xs text-muted-foreground">
          {format(order.createdAt, "d MMMM yyyy - h:mm a", { locale: ar })}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(order)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            عرض
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(order)}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            تعديل
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange(order)}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            الحالة
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
