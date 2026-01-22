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
