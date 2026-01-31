import { useState } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import {
  generateSeedOrders,
  generateSeedSuppliers,
  generateSeedInventory,
} from "@/lib/seed-data";
import { ordersCollection } from "./use-orders-db";
import { suppliersCollection } from "./use-suppliers-db";
import { inventoryApi } from "@/api/inventory.api";

// Hook لإضافة بيانات تجريبية
export function useSeedData() {
  const [isPending, setIsPending] = useState(false);

  return {
    isPending,
    mutate: async (
      _?: void,
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      setIsPending(true);
      try {
        // توليد البيانات
        const orders = generateSeedOrders(15);
        const suppliers = generateSeedSuppliers(8);
        const inventory = generateSeedInventory();

        // إضافة الطلبات
        for (const order of orders) {
          ordersCollection.insert(order);
        }

        // إضافة الموردين
        for (const supplier of suppliers) {
          suppliersCollection.insert(supplier);
        }

        // إضافة المخزون
        let inventoryCount = 0;
        for (const item of inventory) {
          try {
            await inventoryApi.create(item);
            inventoryCount++;
          } catch (error) {
            logger.error("Error seeding inventory item:", error);
          }
        }

        toast.success(
          `تم إضافة ${orders.length} طلب، ${suppliers.length} مورد، و ${inventoryCount} صنف للمخزون بنجاح`,
        );
        options?.onSuccess?.();
      } catch (error) {
        logger.error("Error seeding data:", error);
        toast.error("فشل في إضافة البيانات التجريبية");
        options?.onError?.(error as Error);
      } finally {
        setIsPending(false);
      }
    },
  };
}

// Hook لحذف جميع البيانات
export function useClearData() {
  const [isPending, setIsPending] = useState(false);

  return {
    isPending,
    mutate: async (
      _?: void,
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) => {
      setIsPending(true);
      try {
        // Get all data from IndexedDB
        const { default: localforage } = await import("localforage");

        const ordersDB = localforage.createInstance({
          name: "pharmacy-special-orders",
          storeName: "orders",
        });

        const suppliersDB = localforage.createInstance({
          name: "pharmacy-special-orders",
          storeName: "suppliers",
        });

        // Count items before clearing
        let ordersCount = 0;
        let suppliersCount = 0;

        await ordersDB.iterate(() => {
          ordersCount++;
        });

        await suppliersDB.iterate(() => {
          suppliersCount++;
        });

        // Clear all data
        await ordersDB.clear();
        await suppliersDB.clear();

        // Note: Collections will automatically update when they detect the data is gone
        // We could also manually delete from collections, but clearing IndexedDB is cleaner

        toast.success(
          `تم حذف ${ordersCount} طلب و ${suppliersCount} مورد بنجاح`,
        );
        options?.onSuccess?.();
      } catch (error) {
        logger.error("Error clearing data:", error);
        toast.error("فشل في حذف البيانات");
        options?.onError?.(error as Error);
      } finally {
        setIsPending(false);
      }
    },
  };
}
