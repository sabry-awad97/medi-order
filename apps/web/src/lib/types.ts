// أنواع البيانات للنظام

export type OrderStatus =
  | "pending" // قيد الانتظار
  | "ordered" // تم الطلب
  | "arrived" // وصل
  | "delivered" // تم التسليم
  | "cancelled"; // ملغي

export interface Medicine {
  id: string;
  name: string;
  concentration: string;
  form: string;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  phoneNumber: string;
  medicines: Medicine[];
  status: OrderStatus;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderFormData {
  customerName: string;
  phoneNumber: string;
  medicines: Omit<Medicine, "id">[];
  notes: string;
}

// أنواع بيانات الموردين
export interface Supplier {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  address?: string;

  // الأدوية المتوفرة عادة
  commonMedicines: string[];

  // معلومات الأداء
  avgDeliveryDays: number;
  rating: number; // من 1 إلى 5
  totalOrders: number;

  // ملاحظات
  notes: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierFormData {
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  commonMedicines: string[];
  notes: string;
}
