import { useEffect } from "react";
import { toast } from "sonner";
import { useOrders } from "./use-orders";

/**
 * Hook للتنبيهات التلقائية للطلبات
 * يفحص الطلبات كل ساعة ويعرض تنبيهات للطلبات التي تحتاج متابعة
 */
export function useOrderAlerts() {
  const { data: orders = [] } = useOrders();

  useEffect(() => {
    const checkAlerts = () => {
      const now = new Date();

      orders.forEach((order) => {
        const daysSinceCreated =
          (now.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24);

        // تنبيه للطلبات القديمة (أكثر من 7 أيام في حالة "قيد الانتظار")
        if (daysSinceCreated > 7 && order.status === "pending") {
          toast.warning(
            `⚠️ طلب ${order.customerName} قديم (${Math.floor(daysSinceCreated)} أيام)`,
            {
              id: `old-order-${order.id}`,
              duration: 10000,
              description: "يحتاج متابعة مع المورد",
            },
          );
        }

        // تنبيه للطلبات الواصلة غير المستلمة (أكثر من 3 أيام)
        if (daysSinceCreated > 3 && order.status === "arrived") {
          toast.info(`📦 ${order.customerName} لم يستلم طلبه بعد`, {
            id: `not-picked-${order.id}`,
            duration: 10000,
            description: `مضى ${Math.floor(daysSinceCreated)} أيام على وصول الطلب`,
          });
        }

        // تنبيه للطلبات التي تم طلبها منذ أكثر من 5 أيام ولم تصل
        if (daysSinceCreated > 5 && order.status === "ordered") {
          toast.warning(`🚚 طلب ${order.customerName} متأخر`, {
            id: `delayed-order-${order.id}`,
            duration: 10000,
            description: "تحقق من حالة الطلب مع المورد",
          });
        }
      });
    };

    // فحص فوري عند التحميل
    checkAlerts();

    // فحص كل ساعة
    const interval = setInterval(checkAlerts, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [orders]);
}

/**
 * Hook للحصول على إحصائيات التنبيهات
 */
export function useAlertStats() {
  const { data: orders = [] } = useOrders();

  const now = new Date();

  const oldOrders = orders.filter((order) => {
    const days =
      (now.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return days > 7 && order.status === "pending";
  }).length;

  const notPickedUp = orders.filter((order) => {
    const days =
      (now.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return days > 3 && order.status === "arrived";
  }).length;

  const delayed = orders.filter((order) => {
    const days =
      (now.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return days > 5 && order.status === "ordered";
  }).length;

  return {
    data: {
      oldOrders,
      notPickedUp,
      delayed,
      totalAlerts: oldOrders + notPickedUp + delayed,
    },
  };
}
