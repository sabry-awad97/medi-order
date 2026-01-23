/**
 * TanStack DB Hooks for Suppliers
 *
 * Drop-in replacement for use-suppliers.ts using TanStack DB.
 * Same API, but with reactive collections and optimistic updates.
 */

import { createCollection, eq, useLiveQuery } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { toast } from "sonner";
import { z } from "zod";
import { useMemo } from "react";
import {
  SupplierSchema,
  SupplierFormDataSchema,
  type Supplier,
  type SupplierFormData,
} from "@/lib/types";
import { queryClient } from "@/lib/query-client";

// ============================================================================
// QUERY KEYS
// ============================================================================
export const supplierKeys = {
  all: ["suppliers"] as const,
};

// ============================================================================
// COLLECTION DEFINITION
// ============================================================================
export const suppliersCollection = createCollection(
  queryCollectionOptions({
    queryClient,
    queryKey: supplierKeys.all,
    queryFn: async (): Promise<Supplier[]> => {
      // Load from IndexedDB using localforage
      const { default: localforage } = await import("localforage");

      const suppliersDB = localforage.createInstance({
        name: "pharmacy-special-orders",
        storeName: "suppliers",
      });

      const suppliers: Supplier[] = [];
      await suppliersDB.iterate<Supplier, void>((supplier) => {
        suppliers.push({
          ...supplier,
          createdAt: new Date(supplier.createdAt),
          updatedAt: new Date(supplier.updatedAt),
        });
      });

      // Sort by name (Arabic alphabetical)
      return suppliers.sort((a, b) => a.name.localeCompare(b.name, "ar"));
    },
    getKey: (supplier: Supplier) => supplier.id,

    // Handle INSERT operations
    onInsert: async ({ transaction }) => {
      const mutation = transaction.mutations[0];
      const newSupplier = mutation.modified as Supplier;

      // Validate with Zod
      const validatedSupplier = SupplierSchema.parse(newSupplier);

      // Save to IndexedDB
      const { default: localforage } = await import("localforage");
      const suppliersDB = localforage.createInstance({
        name: "pharmacy-special-orders",
        storeName: "suppliers",
      });

      await suppliersDB.setItem(validatedSupplier.id, validatedSupplier);
      toast.success("تم إضافة المورد بنجاح");
    },

    // Handle UPDATE operations
    onUpdate: async ({ transaction }) => {
      const mutation = transaction.mutations[0];
      const modified = mutation.modified as Supplier;

      // Validate with Zod
      const validatedSupplier = SupplierSchema.parse(modified);

      // Update in IndexedDB
      const { default: localforage } = await import("localforage");
      const suppliersDB = localforage.createInstance({
        name: "pharmacy-special-orders",
        storeName: "suppliers",
      });

      await suppliersDB.setItem(validatedSupplier.id, validatedSupplier);
      toast.success("تم تحديث المورد بنجاح");
    },

    // Handle DELETE operations
    onDelete: async ({ transaction }) => {
      const mutation = transaction.mutations[0];
      const original = mutation.original as Supplier;

      // Remove from IndexedDB
      const { default: localforage } = await import("localforage");
      const suppliersDB = localforage.createInstance({
        name: "pharmacy-special-orders",
        storeName: "suppliers",
      });

      await suppliersDB.removeItem(original.id);
      toast.success("تم حذف المورد بنجاح");
    },
  }),
);

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook لجلب جميع الموردين
 */
export function useSuppliers() {
  const query = useLiveQuery((q) => q.from({ supplier: suppliersCollection }));

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/**
 * Hook لجلب مورد واحد
 */
export function useSupplier(id: string) {
  const query = useLiveQuery(
    (q) =>
      q
        .from({ supplier: suppliersCollection })
        .where(({ supplier }) => eq(supplier.id, id))
        .limit(1),
    [id],
  );

  return {
    data: query.data?.[0] || null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/**
 * Hook للحصول على موردين مقترحين حسب الدواء
 */
export function useSuggestedSuppliers(medicineName: string) {
  const query = useLiveQuery(
    (q) => {
      if (!medicineName || medicineName.length < 2) {
        return q.from({ supplier: suppliersCollection }).limit(0);
      }

      const lowerQuery = medicineName.toLowerCase();
      return q.from({ supplier: suppliersCollection }).fn.where((row) => {
        const supplier = row.supplier;
        return supplier.commonMedicines.some((m) =>
          m.toLowerCase().includes(lowerQuery),
        );
      });
    },
    [medicineName],
  );

  // Calculate scores and sort
  const sortedSuppliers = useMemo(() => {
    if (!query.data) return [];

    return query.data
      .map((supplier) => {
        const rating = supplier.rating as number;
        const avgDeliveryDays = supplier.avgDeliveryDays as number;
        const score = rating * 0.6 + (10 - avgDeliveryDays) * 0.4;

        return {
          ...supplier,
          score,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [query.data]);

  return {
    data: sortedSuppliers,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/**
 * Hook لإضافة مورد
 */
export function useCreateSupplier() {
  const createNewSupplier = (data: SupplierFormData): Supplier => {
    // التحقق من صحة البيانات المدخلة
    const validatedData = SupplierFormDataSchema.parse(data);

    const newSupplier: Supplier = {
      id: crypto.randomUUID(),
      ...validatedData,
      avgDeliveryDays: 3,
      rating: 3,
      totalOrders: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // التحقق من صحة المورد الكامل
    return SupplierSchema.parse(newSupplier);
  };

  return {
    mutate: (data: SupplierFormData, options?: { onSuccess?: () => void }) => {
      try {
        const newSupplier = createNewSupplier(data);
        suppliersCollection.insert(newSupplier);
        options?.onSuccess?.();
      } catch (error) {
        console.error("Error creating supplier:", error);
        if (error instanceof z.ZodError) {
          const firstError = error.issues[0];
          toast.error(`خطأ في التحقق: ${firstError.message}`);
        } else {
          toast.error("فشل في إضافة المورد");
        }
        throw error;
      }
    },
  };
}

/**
 * Hook لتحديث مورد
 */
export function useUpdateSupplier() {
  return {
    mutate: (
      { id, data }: { id: string; data: Partial<SupplierFormData> },
      options?: { onSuccess?: () => void },
    ) => {
      try {
        // التحقق من صحة البيانات المدخلة
        const validatedData = SupplierFormDataSchema.partial().parse(data);

        // Update the supplier in the collection
        suppliersCollection.update(id, (draft) => {
          if (validatedData.name !== undefined) draft.name = validatedData.name;
          if (validatedData.phone !== undefined)
            draft.phone = validatedData.phone;
          if (validatedData.whatsapp !== undefined)
            draft.whatsapp = validatedData.whatsapp;
          if (validatedData.email !== undefined)
            draft.email = validatedData.email;
          if (validatedData.address !== undefined)
            draft.address = validatedData.address;
          if (validatedData.commonMedicines !== undefined)
            draft.commonMedicines = validatedData.commonMedicines;
          if (validatedData.notes !== undefined)
            draft.notes = validatedData.notes;
          draft.updatedAt = new Date();
        });

        options?.onSuccess?.();
      } catch (error) {
        console.error("Error updating supplier:", error);
        if (error instanceof z.ZodError) {
          const firstError = error.issues[0];
          toast.error(`خطأ في التحقق: ${firstError.message}`);
        } else {
          toast.error("فشل في تحديث المورد");
        }
        throw error;
      }
    },
  };
}

/**
 * Hook لحذف مورد
 */
export function useDeleteSupplier() {
  return {
    mutate: (id: string, options?: { onSuccess?: () => void }) => {
      try {
        suppliersCollection.delete(id);
        options?.onSuccess?.();
      } catch (error) {
        console.error("Error deleting supplier:", error);
        toast.error("فشل في حذف المورد");
        throw error;
      }
    },
  };
}
