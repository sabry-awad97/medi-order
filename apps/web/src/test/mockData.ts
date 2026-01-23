import type { Order, Supplier, Medicine } from "@/lib/types";
import type { Settings } from "@/lib/types-settings";

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

// Mock Settings Data
export const mockSettings: Settings = {
  // General
  pharmacyName: "صيدلية الاختبار",
  pharmacyPhone: "0501234567",
  pharmacyAddress: "الرياض، حي النخيل",
  workingHours: "من 9 صباحاً إلى 10 مساءً",

  // Orders
  defaultOrderStatus: "pending",
  autoArchiveDays: 30,
  requireCustomerPhone: true,
  allowedMedicineForms: ["أقراص", "كبسولات", "شراب"],
  maxMedicinesPerOrder: 10,

  // Suppliers
  minSupplierRating: 3,
  maxDeliveryDays: 7,
  requireSupplierEmail: false,

  // Alerts
  enableAlerts: true,
  oldOrderThreshold: 7,
  pickupReminderDays: 3,
  alertCheckInterval: 30,

  // Notifications
  enableNotifications: true,
  notificationSound: true,
  notifyOnNewOrder: true,
  notifyOnStatusChange: true,

  // Appearance
  defaultTheme: "system",
  sidebarDefaultState: "open",
  itemsPerPage: 20,

  // System
  enableDevMode: false,
  autoBackup: true,
  backupIntervalDays: 7,
};
