import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import db from "@/lib/db";
import type { Supplier, SupplierFormData } from "@/lib/types";

// Hook لجلب جميع الموردين
export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: () => db.suppliers.getAll(),
  });
}

// Hook لجلب مورد واحد
export function useSupplier(id: string) {
  return useQuery({
    queryKey: ["suppliers", id],
    queryFn: () => db.suppliers.getById(id),
    enabled: !!id,
  });
}

// Hook للحصول على موردين مقترحين حسب الدواء
export function useSuggestedSuppliers(medicineName: string) {
  return useQuery({
    queryKey: ["suppliers", "suggested", medicineName],
    queryFn: () => db.suppliers.findByMedicine(medicineName),
    enabled: !!medicineName && medicineName.length > 2,
  });
}

// Hook لإضافة مورد
export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SupplierFormData) => {
      const newSupplier: Supplier = {
        id: crypto.randomUUID(),
        ...data,
        avgDeliveryDays: 3,
        rating: 3,
        totalOrders: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return await db.suppliers.create(newSupplier);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("تم إضافة المورد بنجاح");
    },
    onError: (error) => {
      console.error("Error creating supplier:", error);
      toast.error("فشل في إضافة المورد");
    },
  });
}

// Hook لتحديث مورد
export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<SupplierFormData>;
    }) => {
      return await db.suppliers.update(id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers", variables.id] });
      toast.success("تم تحديث المورد بنجاح");
    },
    onError: (error) => {
      console.error("Error updating supplier:", error);
      toast.error("فشل في تحديث المورد");
    },
  });
}

// Hook لحذف مورد
export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await db.suppliers.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("تم حذف المورد بنجاح");
    },
    onError: (error) => {
      console.error("Error deleting supplier:", error);
      toast.error("فشل في حذف المورد");
    },
  });
}
