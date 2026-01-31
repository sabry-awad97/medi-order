import { useState } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import {
  generateSeedOrders,
  generateSeedSuppliers,
  generateSeedInventory,
  generateSeedManufacturers,
  generateManufacturerIds,
} from "@/lib/seed-data";
import { ordersCollection } from "./use-orders-db";
import { suppliersCollection } from "./use-suppliers-db";
import { inventoryApi } from "@/api/inventory.api";
import { manufacturerApi } from "@/api/manufacturer.api";
import { settingsApi } from "@/api/settings.api";
import { clearAuth } from "@/lib/auth";

// Helper to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
        // Generate manufacturer IDs first - these will be used consistently
        const manufacturerIds = generateManufacturerIds();

        // توليد البيانات
        const orders = generateSeedOrders(15);
        const suppliers = generateSeedSuppliers(8);
        const manufacturers = generateSeedManufacturers(manufacturerIds);
        const inventory = generateSeedInventory(manufacturerIds);

        // إضافة الطلبات
        for (const order of orders) {
          ordersCollection.insert(order);
        }

        // إضافة الموردين
        for (const supplier of suppliers) {
          suppliersCollection.insert(supplier);
        }

        // إضافة الشركات المصنعة أولاً (قبل المخزون)
        logger.info("Seeding manufacturers...");
        let manufacturersCount = 0;

        // Create a map to store the actual IDs returned from the backend
        const actualManufacturerIds: Record<string, string> = {};

        try {
          // Create manufacturers one by one to maintain the mapping
          for (const manufacturer of manufacturers) {
            const { id: _id, ...manufacturerData } = manufacturer; // Remove the id field
            const result = await manufacturerApi.create(manufacturerData);

            // Store the mapping: short_name -> actual_id
            actualManufacturerIds[manufacturer.short_name] = result.id;
            manufacturersCount++;

            await delay(30);
          }

          logger.info(
            `Successfully created ${manufacturersCount} manufacturers`,
          );
        } catch (error) {
          logger.error("Error seeding manufacturers:", error);
        }

        // Now create inventory using the actual manufacturer IDs
        logger.info("Seeding inventory items...");
        let inventoryCount = 0;
        const createdItems: string[] = [];

        for (const item of inventory) {
          try {
            // Find the manufacturer short name from the original mapping
            const manufacturerShortName = Object.entries(manufacturerIds).find(
              ([_, id]) => id === item.manufacturer_id,
            )?.[0];

            if (!manufacturerShortName) {
              logger.error(
                "Could not find manufacturer short name for ID:",
                item.manufacturer_id,
              );
              continue;
            }

            // Get the actual ID from the backend
            const actualManufacturerId =
              actualManufacturerIds[
                manufacturers.find((m) => m.id === item.manufacturer_id)
                  ?.short_name || ""
              ];

            if (!actualManufacturerId) {
              logger.error(
                "Could not find actual manufacturer ID for:",
                manufacturerShortName,
              );
              continue;
            }

            // Create the item with the actual manufacturer ID
            const result = await inventoryApi.create({
              ...item,
              manufacturer_id: actualManufacturerId,
            });

            createdItems.push(result.id);
            inventoryCount++;

            // Add a small delay to avoid overwhelming the backend
            await delay(50);
          } catch (error) {
            logger.error("Error seeding inventory item:", error);
          }
        }

        // Create price history by updating prices with different values
        // This simulates price changes over time
        logger.info("Creating price history for inventory items...");

        for (const itemId of createdItems) {
          try {
            // Get the current item to know its current price
            const currentItem = await inventoryApi.get(itemId);
            const basePrice = currentItem.unit_price;

            // Create 2-4 historical price changes
            const priceChanges = Math.floor(Math.random() * 3) + 2; // 2-4 changes

            for (let i = 0; i < priceChanges; i++) {
              // Calculate price variation (-10% to +15%)
              const variation = Math.random() * 0.25 - 0.1; // -10% to +15%
              const newPrice = Math.max(1, basePrice * (1 + variation));

              // Update the price (this will create a price history entry)
              await inventoryApi.updateStock(itemId, {
                unit_price: Math.round(newPrice * 100) / 100, // Round to 2 decimals
              });

              // Small delay between updates
              await delay(30);
            }
          } catch (error) {
            logger.error("Error creating price history for item:", {
              itemId,
              error,
            });
          }
        }

        toast.success(
          `تم إضافة ${orders.length} طلب، ${suppliers.length} مورد، ${manufacturersCount} شركة مصنعة، و ${inventoryCount} صنف للمخزون مع تاريخ الأسعار بنجاح`,
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

        // Clear IndexedDB data
        await ordersDB.clear();
        await suppliersDB.clear();

        // Clear inventory from PostgreSQL
        logger.info("Clearing inventory items from database...");
        let inventoryCount = 0;
        try {
          const inventoryItems = await inventoryApi.listActive();
          inventoryCount = inventoryItems.length;

          // Delete all inventory items
          for (const item of inventoryItems) {
            try {
              await inventoryApi.delete(item.id);
              await delay(30); // Small delay to avoid overwhelming the backend
            } catch (error) {
              logger.error("Error deleting inventory item:", {
                id: item.id,
                error,
              });
            }
          }
        } catch (error) {
          logger.error("Error clearing inventory:", error);
        }

        // Clear manufacturers from PostgreSQL
        logger.info("Clearing manufacturers from database...");
        let manufacturersCount = 0;
        try {
          const manufacturers = await manufacturerApi.listActive();
          manufacturersCount = manufacturers.length;

          // Delete all manufacturers
          for (const manufacturer of manufacturers) {
            try {
              await manufacturerApi.delete(manufacturer.id);
              await delay(30);
            } catch (error) {
              logger.error("Error deleting manufacturer:", {
                id: manufacturer.id,
                error,
              });
            }
          }
        } catch (error) {
          logger.error("Error clearing manufacturers:", error);
        }

        // Clear settings from PostgreSQL
        logger.info("Clearing settings from database...");
        let settingsCount = 0;
        try {
          const settings = await settingsApi.list();
          settingsCount = settings.length;

          // Delete all settings by ID
          for (const setting of settings) {
            try {
              await settingsApi.deleteById(setting.id);
              await delay(30);
            } catch (error) {
              logger.error("Error deleting setting:", {
                id: setting.id,
                error,
              });
            }
          }
        } catch (error) {
          logger.error("Error clearing settings:", error);
        }

        // Clear authentication data from localStorage
        logger.info("Clearing authentication data...");
        clearAuth();

        toast.success(
          `تم حذف جميع البيانات بنجاح: ${ordersCount} طلب، ${suppliersCount} مورد، ${manufacturersCount} شركة مصنعة، ${inventoryCount} صنف من المخزون، و ${settingsCount} إعداد`,
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
