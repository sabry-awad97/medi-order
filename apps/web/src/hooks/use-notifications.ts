import { useEffect, useRef } from "react";
import { useSettingValue } from "./use-settings-db";
import { useOrders } from "./use-orders-db";
import type { Order } from "@/lib/types";
import { logger } from "@/lib/logger";

/**
 * Hook for browser notifications
 * Handles notification permissions and displays notifications based on settings
 */
export function useNotifications() {
  const enableNotifications = useSettingValue<boolean>(
    "enableNotifications",
    true,
  );
  const notifyOnNewOrder = useSettingValue<boolean>("notifyOnNewOrder", true);
  const notifyOnStatusChange = useSettingValue<boolean>(
    "notifyOnStatusChange",
    true,
  );
  const notificationSound = useSettingValue<boolean>("notificationSound", true);

  const { data: orders = [] } = useOrders();
  const previousOrdersRef = useRef<Order[]>([]);
  const notificationPermission = useRef<NotificationPermission>("default");

  // Request notification permission on mount if enabled
  useEffect(() => {
    if (enableNotifications && "Notification" in window) {
      Notification.requestPermission().then((permission) => {
        notificationPermission.current = permission;
        logger.info("Notification permission:", permission);
      });
    }
  }, [enableNotifications]);

  // Check for new orders
  useEffect(() => {
    if (!enableNotifications || !notifyOnNewOrder) {
      return;
    }

    if (previousOrdersRef.current.length === 0) {
      // First load, just store the orders
      previousOrdersRef.current = orders;
      return;
    }

    // Find new orders (orders that weren't in the previous list)
    const newOrders = orders.filter(
      (order) =>
        !previousOrdersRef.current.some(
          (prevOrder) => prevOrder.id === order.id,
        ),
    );

    if (newOrders.length > 0) {
      newOrders.forEach((order) => {
        showNotification(
          "طلب جديد",
          `طلب جديد من ${order.customerName}`,
          notificationSound ?? true,
        );
      });
    }

    previousOrdersRef.current = orders;
  }, [orders, enableNotifications, notifyOnNewOrder, notificationSound]);

  // Check for status changes
  useEffect(() => {
    if (!enableNotifications || !notifyOnStatusChange) {
      return;
    }

    if (previousOrdersRef.current.length === 0) {
      return;
    }

    // Find orders with status changes
    orders.forEach((order) => {
      const previousOrder = previousOrdersRef.current.find(
        (prev) => prev.id === order.id,
      );

      if (previousOrder && previousOrder.status !== order.status) {
        const statusLabels: Record<string, string> = {
          pending: "قيد الانتظار",
          ordered: "تم الطلب",
          arrived: "وصل",
          delivered: "تم التسليم",
          cancelled: "ملغي",
        };

        showNotification(
          "تغيير حالة الطلب",
          `طلب ${order.customerName}: ${statusLabels[order.status] || order.status}`,
          notificationSound ?? true,
        );
      }
    });
  }, [orders, enableNotifications, notifyOnStatusChange, notificationSound]);

  return {
    isEnabled: enableNotifications ?? false,
    permission: notificationPermission.current,
  };
}

/**
 * Show a browser notification
 */
function showNotification(title: string, body: string, playSound: boolean) {
  if (!("Notification" in window)) {
    logger.warn("Browser does not support notifications");
    return;
  }

  if (Notification.permission !== "granted") {
    logger.warn("Notification permission not granted");
    return;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: "/icon.png", // You can customize this
      badge: "/icon.png",
      tag: "pharmacy-order", // Prevents duplicate notifications
      requireInteraction: false,
      silent: !playSound,
    });

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (error) {
    logger.error("Error showing notification:", error);
  }
}
