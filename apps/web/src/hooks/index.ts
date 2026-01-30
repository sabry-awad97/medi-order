// Hooks للطلبات (TanStack DB)
export {
  useOrders,
  useOrder,
  useOrdersByStatus,
  useActiveOrders,
  useSearchOrders,
  useOrderStatistics,
  useCreateOrder,
  useUpdateOrder,
  useUpdateOrderStatus,
  useDeleteOrder,
  ordersCollection,
  orderKeys,
} from "./use-orders-db";

// Hooks للموردين (TanStack DB)
export {
  useSuppliers,
  useSupplier,
  useSuggestedSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  suppliersCollection,
  supplierKeys,
} from "./use-suppliers-db";

// Hooks للتنبيهات
export { useOrderAlerts, useAlertStats } from "./use-order-alerts";

// Hooks للبيانات التجريبية
export { useSeedData, useClearData } from "./use-seed-data";

// Hooks للإعدادات
export {
  useSettings,
  useSetting,
  useUpdateSetting,
  useUpdateSettings,
  useResetSettings,
  useExportSettings,
  useImportSettings,
} from "./use-settings-db";

// Hooks للتحديثات
export { useAppUpdater } from "./use-app-updater";

// Hooks للترجمة
export { useOrderStatusConfig } from "./use-order-status-config";

// Hooks للإشعارات
export { useNotifications } from "./use-notifications";

// Hooks للأرشفة التلقائية
export { useAutoArchive, useArchivableOrdersStats } from "./use-auto-archive";
