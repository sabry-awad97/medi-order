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

// Hooks للمستخدمين (TanStack Query)
export {
  // Query Hooks
  useUser,
  useUserWithStaff,
  useUserByUsername,
  useUserByStaffId,
  useUsers,
  useActiveUsers,
  useUserStatistics,
  // Mutation Hooks
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useRestoreUser,
  useDeleteUserPermanently,
  // Auth Hooks
  useLogin,
  useChangePassword,
  useResetPassword,
  // Utility Hooks
  usePrefetchUser,
  useInvalidateUsers,
  // Query Keys
  userKeys,
} from "./use-users";

// Hooks للمستخدمين (TanStack DB)
export {
  useUsers as useUsersDB,
  useUser as useUserDB,
  useUsersByStatus,
  useActiveUsers as useActiveUsersDB,
  useSearchUsers,
  useUserStatistics as useUserStatisticsDB,
  useCreateUser as useCreateUserDB,
  useUpdateUser as useUpdateUserDB,
  useUpdateUserStatus,
  useToggleUserActive,
  useDeleteUser as useDeleteUserDB,
  useRefreshUsers,
  useUserByUsername as useUserByUsernameDB,
  usersCollection,
  userKeys as userKeysDB,
} from "./use-users-db";

// Hooks للمصادقة (Authentication)
export {
  useAuth,
  useAuthCheck,
  useCurrentUser,
  usePermission,
  useRole,
  useAnyPermission,
  useAllPermissions,
  useAnyRole,
  useLogin as useLoginHook,
  useLogout,
  useRefreshSession,
} from "./use-auth";

// Hooks للإعداد الأولي (Onboarding)
export {
  useCheckFirstRun,
  useCompleteFirstRunSetup,
  useCompleteFirstRunSetupDefault,
  useRefreshFirstRun,
  useResetFirstRunCache,
  onboardingKeys,
} from "./use-onboarding-db";

// Hooks للتنبيهات
export { useOrderAlerts, useAlertStats } from "./use-order-alerts";

// Hooks للبيانات التجريبية
export { useSeedData, useClearData } from "./use-seed-data";

// Hooks للإعدادات
export {
  useSettings,
  useSetting,
  useSettingByKey,
  useSettingsByCategory,
  useSearchSettings,
  useSettingCategories,
  useSettingsStatistics,
  useSettingValue,
  useSetSetting,
  useUpdateSetting,
  useUpdateSettingValue,
  useDeleteSetting,
  useDeleteSettingByKey,
  useRefreshSettings,
} from "./use-settings-db";

// Hooks للتحديثات
export { useAppUpdater } from "./use-app-updater";

// Hooks للترجمة
export { useOrderStatusConfig } from "./use-order-status-config";

// Hooks للإشعارات
export { useNotifications } from "./use-notifications";

// Hooks للأرشفة التلقائية
export { useAutoArchive, useArchivableOrdersStats } from "./use-auto-archive";
