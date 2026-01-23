/**
 * TanStack DB Live Query Collections
 *
 * This file defines derived collections that are live queries over the base collections.
 * These collections automatically update when the underlying data changes.
 */

import {
  createLiveQueryCollection,
  eq,
  gt,
  count,
  sum,
  avg,
} from "@tanstack/react-db";
import { ordersCollection, suppliersCollection } from "./db-collections";
import type { OrderStatus } from "./types";

/**
 * Active Orders Collection
 *
 * Live query that filters orders by status (excluding delivered and cancelled).
 * Automatically updates when orders are added, modified, or deleted.
 */
export const activeOrdersCollection = createLiveQueryCollection((q) =>
  q
    .from({ order: ordersCollection })
    .where(
      ({ order }) =>
        eq(order.status, "pending") ||
        eq(order.status, "ordered") ||
        eq(order.status, "arrived"),
    )
    .orderBy(({ order }) => order.createdAt, "desc"),
);

/**
 * Pending Orders Collection
 *
 * Live query for orders that are pending (not yet ordered from supplier).
 */
export const pendingOrdersCollection = createLiveQueryCollection((q) =>
  q
    .from({ order: ordersCollection })
    .where(({ order }) => eq(order.status, "pending"))
    .orderBy(({ order }) => order.createdAt, "desc"),
);

/**
 * Ordered Orders Collection
 *
 * Live query for orders that have been ordered from supplier but not yet arrived.
 */
export const orderedOrdersCollection = createLiveQueryCollection((q) =>
  q
    .from({ order: ordersCollection })
    .where(({ order }) => eq(order.status, "ordered"))
    .orderBy(({ order }) => order.createdAt, "desc"),
);

/**
 * Arrived Orders Collection
 *
 * Live query for orders that have arrived and are ready for customer pickup.
 */
export const arrivedOrdersCollection = createLiveQueryCollection((q) =>
  q
    .from({ order: ordersCollection })
    .where(({ order }) => eq(order.status, "arrived"))
    .orderBy(({ order }) => order.createdAt, "desc"),
);

/**
 * Old Orders Collection
 *
 * Live query for orders that are older than a threshold (for alerts).
 * Default threshold is 7 days.
 */
export function createOldOrdersCollection(daysThreshold: number = 7) {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

  return createLiveQueryCollection((q) =>
    q
      .from({ order: ordersCollection })
      .where(
        ({ order }) =>
          gt(thresholdDate, order.createdAt) &&
          (eq(order.status, "pending") || eq(order.status, "ordered")),
      )
      .orderBy(({ order }) => order.createdAt, "asc"),
  );
}

/**
 * Order Statistics Collection
 *
 * Live query that aggregates order statistics by status.
 * Automatically recalculates when orders change.
 */
export const orderStatisticsCollection = createLiveQueryCollection((q) =>
  q
    .from({ order: ordersCollection })
    .groupBy(({ order }) => order.status)
    .select(({ order }) => ({
      status: order.status,
      count: count(order.id),
    })),
);

/**
 * Top Suppliers Collection
 *
 * Live query for suppliers sorted by rating and delivery time.
 * Shows the best performing suppliers first.
 */
export const topSuppliersCollection = createLiveQueryCollection((q) =>
  q
    .from({ supplier: suppliersCollection })
    .select(({ supplier }) => {
      const rating = supplier.rating as number;
      const avgDeliveryDays = supplier.avgDeliveryDays as number;

      return {
        id: supplier.id,
        name: supplier.name,
        phone: supplier.phone,
        rating,
        avgDeliveryDays,
        totalOrders: supplier.totalOrders,
        // Calculate a score: rating (60%) + delivery speed (40%)
        score: rating * 0.6 + (10 - avgDeliveryDays) * 0.4,
      };
    })
    .orderBy(({ $selected }) => $selected.score, "desc")
    .limit(10),
);

/**
 * Suppliers by Medicine Collection Factory
 *
 * Creates a live query collection that filters suppliers by medicine name.
 * Use this factory function to create collections for specific medicines.
 */
export function createSuppliersByMedicineCollection(medicineName: string) {
  return createLiveQueryCollection((q) =>
    q
      .from({ supplier: suppliersCollection })
      .fn.where((row) => {
        const supplier = row.supplier;
        return supplier.commonMedicines.some((m) =>
          m.toLowerCase().includes(medicineName.toLowerCase()),
        );
      })
      .select(({ supplier }) => {
        const rating = supplier.rating as number;
        const avgDeliveryDays = supplier.avgDeliveryDays as number;

        return {
          id: supplier.id,
          name: supplier.name,
          phone: supplier.phone,
          whatsapp: supplier.whatsapp,
          rating,
          avgDeliveryDays,
          totalOrders: supplier.totalOrders,
          commonMedicines: supplier.commonMedicines,
          // Calculate a score: rating (60%) + delivery speed (40%)
          score: rating * 0.6 + (10 - avgDeliveryDays) * 0.4,
        };
      })
      .orderBy(({ $selected }) => $selected.score, "desc"),
  );
}

/**
 * Recent Orders Collection
 *
 * Live query for the most recent orders (last 20).
 * Useful for dashboard views.
 */
export const recentOrdersCollection = createLiveQueryCollection((q) =>
  q
    .from({ order: ordersCollection })
    .orderBy(({ order }) => order.createdAt, "desc")
    .limit(20),
);

/**
 * Orders by Status Collection Factory
 *
 * Creates a live query collection that filters orders by a specific status.
 * Use this factory function to create collections for specific statuses.
 */
export function createOrdersByStatusCollection(status: OrderStatus) {
  return createLiveQueryCollection((q) =>
    q
      .from({ order: ordersCollection })
      .where(({ order }) => eq(order.status, status))
      .orderBy(({ order }) => order.createdAt, "desc"),
  );
}

/**
 * Search Orders Collection Factory
 *
 * Creates a live query collection that searches orders by customer name or medicine name.
 * Use this factory function to create collections for specific search queries.
 */
export function createSearchOrdersCollection(searchQuery: string) {
  const lowerQuery = searchQuery.toLowerCase();

  return createLiveQueryCollection((q) =>
    q
      .from({ order: ordersCollection })
      .fn.where((row) => {
        const order = row.order;
        // Search in customer name
        if (order.customerName.toLowerCase().includes(lowerQuery)) {
          return true;
        }
        // Search in medicine names
        return order.medicines.some((m) =>
          m.name.toLowerCase().includes(lowerQuery),
        );
      })
      .orderBy(({ order }) => order.createdAt, "desc"),
  );
}

/**
 * Search Suppliers Collection Factory
 *
 * Creates a live query collection that searches suppliers by name, phone, or medicine.
 * Use this factory function to create collections for specific search queries.
 */
export function createSearchSuppliersCollection(searchQuery: string) {
  const lowerQuery = searchQuery.toLowerCase();

  return createLiveQueryCollection((q) =>
    q
      .from({ supplier: suppliersCollection })
      .fn.where((row) => {
        const supplier = row.supplier;
        // Search in name
        if (supplier.name.toLowerCase().includes(lowerQuery)) {
          return true;
        }
        // Search in phone
        if (supplier.phone.includes(searchQuery)) {
          return true;
        }
        // Search in medicines
        return supplier.commonMedicines.some((m) =>
          m.toLowerCase().includes(lowerQuery),
        );
      })
      .orderBy(({ supplier }) => supplier.name, "asc"),
  );
}
