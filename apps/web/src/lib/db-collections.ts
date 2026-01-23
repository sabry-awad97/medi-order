/**
 * TanStack DB Collections
 *
 * This file defines the base collections that store data with IndexedDB persistence.
 * Collections are reactive and automatically sync with IndexedDB.
 */

import { createCollection } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import {
  OrderSchema,
  SupplierSchema,
  type Order,
  type Supplier,
} from "./types";
import type { Settings } from "./types-settings";
import { queryClient } from "./query-client";

/**
 * Orders Collection
 *
 * Stores all pharmacy special orders with IndexedDB persistence.
 * Automatically loads data on initialization and syncs changes to IndexedDB.
 */
export const ordersCollection = createCollection(
  queryCollectionOptions({
    queryClient,
    queryKey: ["orders"],
    queryFn: async (): Promise<Order[]> => {
      // Load from IndexedDB using localforage
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

      // Sort by creation date (newest first)
      return orders.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    },
    getKey: (order: Order) => order.id,

    // Handle INSERT operations
    onInsert: async ({ transaction }) => {
      const mutation = transaction.mutations[0];
      const newOrder = mutation.modified as Order;

      // Validate with Zod
      const validatedOrder = OrderSchema.parse(newOrder);

      // Save to IndexedDB
      const { default: localforage } = await import("localforage");
      const ordersDB = localforage.createInstance({
        name: "pharmacy-special-orders",
        storeName: "orders",
      });

      await ordersDB.setItem(validatedOrder.id, validatedOrder);
    },

    // Handle UPDATE operations
    onUpdate: async ({ transaction }) => {
      const mutation = transaction.mutations[0];
      const modified = mutation.modified as Order;

      // Validate with Zod
      const validatedOrder = OrderSchema.parse(modified);

      // Update in IndexedDB
      const { default: localforage } = await import("localforage");
      const ordersDB = localforage.createInstance({
        name: "pharmacy-special-orders",
        storeName: "orders",
      });

      await ordersDB.setItem(validatedOrder.id, validatedOrder);
    },

    // Handle DELETE operations
    onDelete: async ({ transaction }) => {
      const mutation = transaction.mutations[0];
      const original = mutation.original as Order;

      // Remove from IndexedDB
      const { default: localforage } = await import("localforage");
      const ordersDB = localforage.createInstance({
        name: "pharmacy-special-orders",
        storeName: "orders",
      });

      await ordersDB.removeItem(original.id);
    },
  }),
);

/**
 * Suppliers Collection
 *
 * Stores all supplier information with IndexedDB persistence.
 * Automatically loads data on initialization and syncs changes to IndexedDB.
 */
export const suppliersCollection = createCollection(
  queryCollectionOptions({
    queryClient,
    queryKey: ["suppliers"],
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
    },
  }),
);
