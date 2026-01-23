import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ORDER_STATUS_CONFIG } from "@/lib/constants";
import type { Order, OrderStatus } from "@/lib/types";

interface StatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onConfirm: (orderId: string, newStatus: OrderStatus) => void;
}

export function StatusChangeDialog({
  open,
  onOpenChange,
  order,
  onConfirm,
}: StatusChangeDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "">("");

  const handleConfirm = () => {
    if (order && selectedStatus) {
      onConfirm(order.id, selectedStatus);
      setSelectedStatus("");
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setSelectedStatus("");
    onOpenChange(false);
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col p-0">
        <div className="p-4 border-b shrink-0">
          <DialogHeader>
            <DialogTitle className="text-2xl">تغيير حالة الطلب</DialogTitle>
            <DialogDescription>
              اختر الحالة الجديدة للطلب الخاص بـ {order.customerName}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-2">
            <Label>الحالة الحالية</Label>
            <div className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">الحالة:</span>
              <span className="font-medium">
                {ORDER_STATUS_CONFIG[order.status].label}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newStatus">الحالة الجديدة *</Label>
            <Select
              items={Object.entries(ORDER_STATUS_CONFIG).map(
                ([status, config]) => ({
                  value: status,
                  label: config.label,
                }),
              )}
              value={selectedStatus}
              onValueChange={(value) => setSelectedStatus(value as OrderStatus)}
            >
              <SelectTrigger id="newStatus" className="text-right">
                <SelectValue placeholder="اختر الحالة الجديدة" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ORDER_STATUS_CONFIG).map(([status, config]) => (
                  <SelectItem
                    key={status}
                    value={status}
                    disabled={status === order.status}
                  >
                    <div className="flex items-center gap-2">
                      <span>{config.label}</span>
                      {status === order.status && (
                        <span className="text-xs text-muted-foreground">
                          (الحالية)
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-4 border-t shrink-0">
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleClose}>
              إلغاء
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedStatus}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              تأكيد التغيير
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
