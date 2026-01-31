import type { Order, Supplier, Medicine } from "@/lib/types";
import type { SettingResponse } from "@/api/settings.api";

// Mock Medicine Data
export const mockMedicine: Medicine = {
  id: "med-1",
  name: "باراسيتامول",
  concentration: "500mg",
  form: "أقراص",
  quantity: 2,
};

export const mockMedicines: Medicine[] = [
  mockMedicine,
  {
    id: "med-2",
    name: "أموكسيسيلين",
    concentration: "250mg",
    form: "كبسولات",
    quantity: 1,
  },
];

// Mock Order Data
export const mockOrder: Order = {
  id: "order-1",
  customerName: "أحمد محمد",
  phoneNumber: "0501234567",
  medicines: mockMedicines,
  status: "pending",
  notes: "طلب عاجل",
  createdAt: new Date("2026-01-20"),
  updatedAt: new Date("2026-01-20"),
};

export const mockOrders: Order[] = [
  mockOrder,
  {
    id: "order-2",
    customerName: "فاطمة علي",
    phoneNumber: "0507654321",
    medicines: [mockMedicine],
    status: "ordered",
    notes: "",
    createdAt: new Date("2026-01-21"),
    updatedAt: new Date("2026-01-21"),
  },
  {
    id: "order-3",
    customerName: "خالد سعيد",
    phoneNumber: "0509876543",
    medicines: mockMedicines,
    status: "arrived",
    notes: "جاهز للاستلام",
    createdAt: new Date("2026-01-22"),
    updatedAt: new Date("2026-01-22"),
  },
];

// Mock Supplier Data
export const mockSupplier: Supplier = {
  id: "supplier-1",
  name: "شركة الدواء المتحدة",
  phone: "0501111111",
  whatsapp: "0501111111",
  email: "info@pharmacy.com",
  address: "الرياض، حي النخيل",
  commonMedicines: ["باراسيتامول", "أموكسيسيلين"],
  avgDeliveryDays: 3,
  rating: 4.5,
  totalOrders: 25,
  notes: "مورد موثوق",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

export const mockSuppliers: Supplier[] = [
  mockSupplier,
  {
    id: "supplier-2",
    name: "مؤسسة الصحة للأدوية",
    phone: "0502222222",
    email: "contact@health.com",
    address: "جدة، حي الروضة",
    commonMedicines: ["إيبوبروفين", "أسبرين"],
    avgDeliveryDays: 2,
    rating: 5,
    totalOrders: 50,
    notes: "",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
];

// Mock Settings Data (individual setting records)
export const mockSettings: SettingResponse[] = [
  // General
  {
    id: "setting-1",
    key: "pharmacyName",
    value: "صيدلية الاختبار",
    category: "general",
    description: null,
    updated_by: null,
    created_at: new Date("2026-01-01").toISOString(),
    updated_at: new Date("2026-01-01").toISOString(),
  },
  {
    id: "setting-2",
    key: "pharmacyPhone",
    value: "0501234567",
    category: "general",
    description: null,
    updated_by: null,
    created_at: new Date("2026-01-01").toISOString(),
    updated_at: new Date("2026-01-01").toISOString(),
  },
  {
    id: "setting-3",
    key: "pharmacyAddress",
    value: "الرياض، حي النخيل",
    category: "general",
    description: null,
    updated_by: null,
    created_at: new Date("2026-01-01").toISOString(),
    updated_at: new Date("2026-01-01").toISOString(),
  },
  {
    id: "setting-4",
    key: "workingHours",
    value: "من 9 صباحاً إلى 10 مساءً",
    category: "general",
    description: null,
    updated_by: null,
    created_at: new Date("2026-01-01").toISOString(),
    updated_at: new Date("2026-01-01").toISOString(),
  },
  // Orders
  {
    id: "setting-5",
    key: "defaultOrderStatus",
    value: "pending",
    category: "orders",
    description: null,
    updated_by: null,
    created_at: new Date("2026-01-01").toISOString(),
    updated_at: new Date("2026-01-01").toISOString(),
  },
  {
    id: "setting-6",
    key: "autoArchiveDays",
    value: 30,
    category: "orders",
    description: null,
    updated_by: null,
    created_at: new Date("2026-01-01").toISOString(),
    updated_at: new Date("2026-01-01").toISOString(),
  },
  {
    id: "setting-7",
    key: "requireCustomerPhone",
    value: true,
    category: "orders",
    description: null,
    updated_by: null,
    created_at: new Date("2026-01-01").toISOString(),
    updated_at: new Date("2026-01-01").toISOString(),
  },
  {
    id: "setting-8",
    key: "maxMedicinesPerOrder",
    value: 10,
    category: "orders",
    description: null,
    updated_by: null,
    created_at: new Date("2026-01-01").toISOString(),
    updated_at: new Date("2026-01-01").toISOString(),
  },
  // Appearance
  {
    id: "setting-9",
    key: "defaultTheme",
    value: "system",
    category: "appearance",
    description: null,
    updated_by: null,
    created_at: new Date("2026-01-01").toISOString(),
    updated_at: new Date("2026-01-01").toISOString(),
  },
  {
    id: "setting-10",
    key: "defaultLanguage",
    value: "en",
    category: "appearance",
    description: null,
    updated_by: null,
    created_at: new Date("2026-01-01").toISOString(),
    updated_at: new Date("2026-01-01").toISOString(),
  },
];
