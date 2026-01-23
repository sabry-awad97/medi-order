/**
 * TanStack DB Hooks for Orders
 *
 * Drop-in replacement for use-orders.ts using TanStack DB.
 * Same API, but with reactive collections and optimistic updates.
 */

import type { Order, OrderFormData, OrderStatus } from "@/lib/types";
import {
  OrderSchema,
  OrderFormDataSchema,
  OrderStatusSchema,
} from "@/lib/types";
import { queryClient } from "@/lib/query-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection, eq, useLiveQuery } from "@tanstack/react-db";
import { useMemo } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { logger } from "@/lib/logger";

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function fetchOrders(): Promise<Order[]> {
  try {
    const { default: localforage } = await import("localforage");

    const ordersDB = localforage.createInstance({
      name: "pharmacy-special-orders",
      storeName: "orders",
    });

    const orders: Order[] = [];
    await ordersDB.iterate<Order, void>((order) => {
      orders.push({
        ...order,
        createdAt: new Date(order.createdAt),
        updatedAt: new Date(order.updatedAt),
      });
    });

    return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    logger.error("Error fetching orders:", error);
    return [];
  }
}

async function createOrderAPI(order: Order): Promise<void> {
  const { default: localforage } = await import("localforage");
  const ordersDB = localforage.createInstance({
    name: "pharmacy-special-orders",
    storeName: "orders",
  });
  await ordersDB.setItem(order.id, order);
}

async function updateOrderAPI(order: Order): Promise<void> {
  const { default: localforage } = await import("localforage");
  const ordersDB = localforage.createInstance({
    name: "pharmacy-special-orders",
    storeName: "orders",
  });
  await ordersDB.setItem(order.id, order);
}

async function deleteOrderAPI(id: string): Promise<void> {
  const { default: localforage } = await import("localforage");
  const ordersDB = localforage.createInstance({
    name: "pharmacy-special-orders",
    storeName: "orders",
  });
  await ordersDB.removeItem(id);
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const orderKeys = {
  all: ["orders"] as const,
};

// ============================================================================
// COLLECTION DEFINITION
// ============================================================================

export const ordersCollection = createCollection(
  queryCollectionOptions({
    queryKey: orderKeys.all,
    queryClient,
    queryFn: fetchOrders,
    getKey: (order) => order.id,

    onInsert: async ({ transaction }) => {
      const { modified } = transaction.mutations[0];
      const validatedOrder = OrderSchema.parse(modified);
      await createOrderAPI(validatedOrder);
      toast.success("تم إضافة الطلب بنجاح");
    },

    onUpdate: async ({ transaction }) => {
      const { modified } = transaction.mutations[0];
      const validatedOrder = OrderSchema.parse(modified);
      await updateOrderAPI(validatedOrder);
      toast.success("تم تحديث الطلب بنجاح");
    },

    onDelete: async ({ transaction }) => {
      const { original } = transaction.mutations[0];
      await deleteOrderAPI(original.id);
      toast.success("تم حذف الطلب بنجاح");
    },
  }),
);

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook لجلب جميع الطلبات
 */
export function useOrders() {
  const query = useLiveQuery((q) => q.from({ order: ordersCollection }));

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/**
 * Hook لجلب طلب واحد
 */
export function useOrder(id: string) {
  const query = useLiveQuery(
    (q) =>
      q
        .from({ order: ordersCollection })
        .where(({ order }) => eq(order.id, id))
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
 * Hook لجلب الطلبات حسب الحالة
 */
export function useOrdersByStatus(status: OrderStatus | null) {
  const query = useLiveQuery(
    (q) => {
      if (!status) {
        return q.from({ order: ordersCollection });
      }
      return q
        .from({ order: ordersCollection })
        .where(({ order }) => eq(order.status, status));
    },
    [status],
  );

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/**
 * Hook لجلب الطلبات النشطة (pending, ordered, arrived)
 */
export function useActiveOrders() {
  const query = useLiveQuery((q) => q.from({ order: ordersCollection }));

  const activeOrders = useMemo(() => {
    if (!query.data) return [];
    return query.data.filter(
      (order) =>
        order.status === "pending" ||
        order.status === "ordered" ||
        order.status === "arrived",
    );
  }, [query.data]);

  return {
    data: activeOrders,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/**
 * Hook للبحث في الطلبات
 */
export function useSearchOrders(searchQuery: string) {
  const query = useLiveQuery((q) => q.from({ order: ordersCollection }));

  const filteredOrders = useMemo(() => {
    if (!query.data || !searchQuery || searchQuery.length < 2) {
      return query.data || [];
    }

    const lowerQuery = searchQuery.toLowerCase();
    return query.data.filter((order) => {
      if (order.customerName.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      if (order.phoneNumber.includes(searchQuery)) {
        return true;
      }
      return order.medicines.some((m) =>
        m.name.toLowerCase().includes(lowerQuery),
      );
    });
  }, [query.data, searchQuery]);

  return {
    data: filteredOrders,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/**
 * Hook لإحصائيات الطلبات
 */
export function useOrderStatistics() {
  const { data: orders } = useOrders();

  const stats = useMemo(() => {
    if (!orders) {
      return {
        total: 0,
        pending: 0,
        ordered: 0,
        arrived: 0,
        delivered: 0,
        cancelled: 0,
      };
    }

    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      ordered: orders.filter((o) => o.status === "ordered").length,
      arrived: orders.filter((o) => o.status === "arrived").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    };
  }, [orders]);

  return stats;
}

/**
 * Hook لإضافة طلب
 */
export function useCreateOrder() {
  const createNewOrder = (data: OrderFormData): Order => {
    const validatedData = OrderFormDataSchema.parse(data);

    return {
      id: crypto.randomUUID(),
      customerName: validatedData.customerName,
      phoneNumber: validatedData.phoneNumber,
      medicines: validatedData.medicines.map((m) => ({
        ...m,
        id: crypto.randomUUID(),
      })),
      status: "pending",
      notes: validatedData.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  return {
    mutate: (
      data: OrderFormData,
      options?: {
        onSuccess?: (order: Order) => void;
        onError?: (error: Error) => void;
      },
    ) => {
      try {
        const newOrder = createNewOrder(data);
        const validatedOrder = OrderSchema.parse(newOrder);
        ordersCollection.insert(validatedOrder);
        options?.onSuccess?.(validatedOrder);
        return validatedOrder;
      } catch (error) {
        logger.error("Error creating order:", error);
        if (error instanceof z.ZodError) {
          const firstError = error.issues[0];
          toast.error(`خطأ في التحقق: ${firstError.message}`);
        } else {
          toast.error("فشل في إضافة الطلب");
        }
        options?.onError?.(error as Error);
        throw error;
      }
    },
  };
}

/**
 * Hook لتحديث طلب
 */
export function useUpdateOrder() {
  const updateOrderData = (id: string, data: OrderFormData) => {
    const validatedData = OrderFormDataSchema.parse(data);

    ordersCollection.update(id, (draft) => {
      draft.customerName = validatedData.customerName;
      draft.phoneNumber = validatedData.phoneNumber;
      draft.medicines = validatedData.medicines.map((m) => ({
        ...m,
        id: crypto.randomUUID(),
      }));
      draft.notes = validatedData.notes;
      draft.updatedAt = new Date();
    });
  };

  return {
    mutate: (
      { id, data }: { id: string; data: OrderFormData },
      options?: { onSuccess?: () => void },
    ) => {
      try {
        updateOrderData(id, data);
        queryClient.invalidateQueries({ queryKey: ["orders", id] });
        options?.onSuccess?.();
      } catch (error) {
        logger.error("Error updating order:", error);
        if (error instanceof z.ZodError) {
          const firstError = error.issues[0];
          toast.error(`خطأ في التحقق: ${firstError.message}`);
        } else {
          toast.error("فشل في تحديث الطلب");
        }
        throw error;
      }
    },
  };
}

/**
 * Hook لتغيير حالة الطلب
 */
export function useUpdateOrderStatus() {
  const updateStatus = (id: string, status: OrderStatus) => {
    const validatedStatus = OrderStatusSchema.parse(status);

    ordersCollection.update(id, (draft) => {
      draft.status = validatedStatus;
      draft.updatedAt = new Date();
    });
  };

  return {
    mutate: (
      { id, status }: { id: string; status: OrderStatus },
      options?: { onSuccess?: () => void },
    ) => {
      try {
        updateStatus(id, status);
        queryClient.invalidateQueries({ queryKey: ["orders", id] });
        options?.onSuccess?.();
      } catch (error) {
        logger.error("Error updating order status:", error);
        if (error instanceof z.ZodError) {
          const firstError = error.issues[0];
          toast.error(`خطأ في التحقق: ${firstError.message}`);
        } else {
          toast.error("فشل في تغيير حالة الطلب");
        }
        throw error;
      }
    },
  };
}

/**
 * Hook لحذف طلب
 */
export function useDeleteOrder() {
  return {
    mutate: (id: string, options?: { onSuccess?: () => void }) => {
      try {
        ordersCollection.delete(id);
        options?.onSuccess?.();
      } catch (error) {
        logger.error("Error deleting order:", error);
        toast.error("فشل في حذف الطلب");
        throw error;
      }
    },
  };
}
