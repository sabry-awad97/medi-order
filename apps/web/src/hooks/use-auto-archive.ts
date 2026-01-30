import { useEffect } from "react";
import { useSettings } from "./use-settings-db";
import { useOrders, useUpdateOrderStatus } from "./use-orders-db";
import type { Order } from "@/lib/types";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

/**
 * Hook for auto-archiving old delivered orders
 * Runs periodically to check for orders that should be archived
 */
export function useAutoArchive() {
  const { data: settings } = useSettings();
  const { data: orders = [] } = useOrders();
  const updateOrderStatus = useUpdateOrderStatus();

  useEffect(() => {
    // Check if auto-archive is enabled
    const autoArchiveDays = settings?.autoArchiveDays;
    if (!autoArchiveDays || autoArchiveDays <= 0) {
      return;
    }

    const checkAndArchive = () => {
      const now = new Date();
      let archivedCount = 0;

      orders.forEach((order: Order) => {
        // Only archive delivered orders
        if (order.status !== "delivered") {
          return;
        }

        // Calculate days since last update
        const daysSinceUpdate =
          (now.getTime() - order.updatedAt.getTime()) / (1000 * 60 * 60 * 24);

        // Archive if older than threshold
        if (daysSinceUpdate > autoArchiveDays) {
          logger.info(
            `Auto-archiving order ${order.id} (${Math.floor(daysSinceUpdate)} days old)`,
          );

          // Change status to cancelled (we use this as "archived")
          // In a real app, you might want a separate "archived" status
          updateOrderStatus.mutate({
            id: order.id,
            status: "cancelled",
          });

          archivedCount++;
        }
      });

      if (archivedCount > 0) {
        toast.info(`تم أرشفة ${archivedCount} طلب تلقائياً`, {
          description: `الطلبات المسلمة منذ أكثر من ${autoArchiveDays} يوم`,
        });
      }
    };

    // Run immediately on mount
    checkAndArchive();

    // Run every 24 hours
    const interval = setInterval(checkAndArchive, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [orders, settings?.autoArchiveDays, updateOrderStatus]);
}

/**
 * Get statistics about archivable orders
 */
export function useArchivableOrdersStats() {
  const { data: settings } = useSettings();
  const { data: orders = [] } = useOrders();

  const autoArchiveDays = settings?.autoArchiveDays ?? 0;

  if (autoArchiveDays <= 0) {
    return {
      count: 0,
      orders: [],
    };
  }

  const now = new Date();
  const archivableOrders = orders.filter((order: Order) => {
    if (order.status !== "delivered") {
      return false;
    }

    const daysSinceUpdate =
      (now.getTime() - order.updatedAt.getTime()) / (1000 * 60 * 60 * 24);

    return daysSinceUpdate > autoArchiveDays;
  });

  return {
    count: archivableOrders.length,
    orders: archivableOrders,
  };
}
