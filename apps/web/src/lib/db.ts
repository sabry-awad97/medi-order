import localforage from "localforage";
import type { Order, Supplier } from "./types";

// إعداد قاعدة البيانات المحلية للطلبات
const ordersDB = localforage.createInstance({
  name: "pharmacy-special-orders",
  storeName: "orders",
  description: "قاعدة بيانات الطلبات الخاصة",
});

// إعداد قاعدة البيانات المحلية للموردين
const suppliersDB = localforage.createInstance({
  name: "pharmacy-special-orders",
  storeName: "suppliers",
  description: "قاعدة بيانات الموردين",
});

// دوال إدارة الطلبات
export const db = {
  orders: {
    // جلب جميع الطلبات
    async getAll(): Promise<Order[]> {
      const orders: Order[] = [];
      await ordersDB.iterate<Order, void>((order) => {
        orders.push({
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
        });
      });
      return orders.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    },

    // جلب طلب واحد
    async getById(id: string): Promise<Order | null> {
      const order = await ordersDB.getItem<Order>(id);
      if (!order) return null;
      return {
        ...order,
        createdAt: new Date(order.createdAt),
        updatedAt: new Date(order.updatedAt),
      };
    },

    // حفظ طلب جديد
    async create(order: Order): Promise<Order> {
      await ordersDB.setItem(order.id, order);
      return order;
    },

    // تحديث طلب
    async update(id: string, updates: Partial<Order>): Promise<Order> {
      const existing = await this.getById(id);
      if (!existing) throw new Error("Order not found");

      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date(),
      };

      await ordersDB.setItem(id, updated);
      return updated;
    },

    // حذف طلب
    async delete(id: string): Promise<void> {
      await ordersDB.removeItem(id);
    },

    // مسح جميع الطلبات
    async clear(): Promise<void> {
      await ordersDB.clear();
    },
  },

  suppliers: {
    // جلب جميع الموردين
    async getAll(): Promise<Supplier[]> {
      const suppliers: Supplier[] = [];
      await suppliersDB.iterate<Supplier, void>((supplier) => {
        suppliers.push({
          ...supplier,
          createdAt: new Date(supplier.createdAt),
          updatedAt: new Date(supplier.updatedAt),
        });
      });
      return suppliers.sort((a, b) => a.name.localeCompare(b.name, "ar"));
    },

    // جلب مورد واحد
    async getById(id: string): Promise<Supplier | null> {
      const supplier = await suppliersDB.getItem<Supplier>(id);
      if (!supplier) return null;
      return {
        ...supplier,
        createdAt: new Date(supplier.createdAt),
        updatedAt: new Date(supplier.updatedAt),
      };
    },

    // حفظ مورد جديد
    async create(supplier: Supplier): Promise<Supplier> {
      await suppliersDB.setItem(supplier.id, supplier);
      return supplier;
    },

    // تحديث مورد
    async update(id: string, updates: Partial<Supplier>): Promise<Supplier> {
      const existing = await this.getById(id);
      if (!existing) throw new Error("Supplier not found");

      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date(),
      };

      await suppliersDB.setItem(id, updated);
      return updated;
    },

    // حذف مورد
    async delete(id: string): Promise<void> {
      await suppliersDB.removeItem(id);
    },

    // البحث عن موردين حسب الدواء
    async findByMedicine(medicineName: string): Promise<Supplier[]> {
      const all = await this.getAll();
      return all
        .filter((s) =>
          s.commonMedicines.some((m) =>
            m.toLowerCase().includes(medicineName.toLowerCase()),
          ),
        )
        .sort((a, b) => {
          // ترتيب حسب التقييم ووقت التوصيل
          const scoreA = a.rating * 0.6 + (10 - a.avgDeliveryDays) * 0.4;
          const scoreB = b.rating * 0.6 + (10 - b.avgDeliveryDays) * 0.4;
          return scoreB - scoreA;
        });
    },

    // مسح جميع الموردين
    async clear(): Promise<void> {
      await suppliersDB.clear();
    },
  },
};

export default db;
