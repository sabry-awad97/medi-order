import type { OrderStatus } from "./types";

// حالات الطلبات مع الألوان والنصوص العربية
export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    color: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  pending: {
    label: "قيد الانتظار",
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    variant: "secondary",
  },
  ordered: {
    label: "تم الطلب",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    variant: "default",
  },
  arrived: {
    label: "وصل",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    variant: "outline",
  },
  delivered: {
    label: "تم التسليم",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    variant: "outline",
  },
  cancelled: {
    label: "ملغي",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    variant: "destructive",
  },
};

// أشكال الأدوية الصيدلانية
export const MEDICINE_FORMS = [
  "أقراص",
  "كبسولات",
  "شراب",
  "أمبول",
  "حقن",
  "مرهم",
  "كريم",
  "قطرة",
  "بخاخ",
  "لبوس",
  "أخرى",
];

export type MedicineForm = (typeof MEDICINE_FORMS)[number];
