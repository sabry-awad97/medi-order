import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import db from "@/lib/db";
import type { Order, OrderFormData, OrderStatus } from "@/lib/types";

// Hook لجلب جميع الطلبات
export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: () => db.orders.getAll(),
  });
}

// Hook لجلب طلب واحد
export function useOrder(id: string) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => db.orders.getById(id),
    enabled: !!id,
  });
}

// Hook لإضافة طلب
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: OrderFormData) => {
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

      return await db.orders.create(newOrder);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("تم إضافة الطلب بنجاح");
    },
    onError: (error) => {
      console.error("Error creating order:", error);
      toast.error("فشل في إضافة الطلب");
    },
  });
}

// Hook لتحديث طلب
export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: OrderFormData }) => {
      return await db.orders.update(id, {
        customerName: data.customerName,
        phoneNumber: data.phoneNumber,
        medicines: data.medicines.map((m) => ({
          ...m,
          id: crypto.randomUUID(),
        })),
        notes: data.notes,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", variables.id] });
      toast.success("تم تحديث الطلب بنجاح");
    },
    onError: (error) => {
      console.error("Error updating order:", error);
      toast.error("فشل في تحديث الطلب");
    },
  });
}

// Hook لتغيير حالة الطلب
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      return await db.orders.update(id, { status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", variables.id] });
      toast.success("تم تغيير حالة الطلب بنجاح");
    },
    onError: (error) => {
      console.error("Error updating order status:", error);
      toast.error("فشل في تغيير حالة الطلب");
    },
  });
}

// Hook لحذف طلب
export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await db.orders.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("تم حذف الطلب بنجاح");
    },
    onError: (error) => {
      console.error("Error deleting order:", error);
      toast.error("فشل في حذف الطلب");
    },
  });
}
