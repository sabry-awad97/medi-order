/**
 * User API
 *
 * Provides type-safe access to user-related Tauri commands.
 * All functions handle both Tauri and browser environments gracefully.
 *
 * @module api/user
 */

import { z } from "zod";
import { invokeCommand, type PaginationParams } from "@/lib/tauri-api";
import { createLogger } from "@/lib/logger";

const logger = createLogger("UserAPI");

// ============================================================================
// Schemas
// ============================================================================

/**
 * User status enum
 */
export const UserStatusSchema = z.enum([
  "Active",
  "Inactive",
  "Suspended",
  "Locked",
]);
export type UserStatus = z.infer<typeof UserStatusSchema>;

/**
 * User ID schema
 */
export const UserIdSchema = z.string().uuid();
export type UserId = z.infer<typeof UserIdSchema>;

/**
 * User response schema
 */
export const UserResponseSchema = z.object({
  id: UserIdSchema,
  staff_id: UserIdSchema,
  username: z.string(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  display_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  npi_number: z.string().nullable(),
  supervisor_id: UserIdSchema.nullable(),
  role_id: UserIdSchema,
  status: UserStatusSchema,
  is_active: z.boolean(),
  last_login_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type UserResponse = z.infer<typeof UserResponseSchema>;

/**
 * User with staff information schema
 */
export const UserWithStaffSchema = UserResponseSchema.extend({
  staff_full_name: z.string(),
  staff_employee_id: z.string(),
  staff_position: z.string(),
  staff_department: z.string(),
  staff_email: z.string().email(),
  staff_phone: z.string().nullable(),
  staff_employment_status: z.string(),
});
export type UserWithStaff = z.infer<typeof UserWithStaffSchema>;

/**
 * Create user DTO schema
 */
export const CreateUserSchema = z.object({
  staff_id: UserIdSchema,
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  display_name: z.string().optional(),
  avatar_url: z.string().url().optional(),
  npi_number: z.string().optional(),
  supervisor_id: UserIdSchema.optional(),
  role_id: UserIdSchema,
  status: UserStatusSchema,
  is_active: z.boolean(),
  created_by: UserIdSchema.optional(),
  updated_by: UserIdSchema.optional(),
});
export type CreateUser = z.infer<typeof CreateUserSchema>;

/**
 * Update user DTO schema
 */
export const UpdateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  display_name: z.string().optional(),
  avatar_url: z.string().url().optional(),
  npi_number: z.string().optional(),
  supervisor_id: UserIdSchema.optional(),
  role_id: UserIdSchema.optional(),
  status: UserStatusSchema.optional(),
  is_active: z.boolean().optional(),
  updated_by: UserIdSchema.optional(),
});
export type UpdateUser = z.infer<typeof UpdateUserSchema>;

/**
 * Login DTO schema
 */
export const LoginSchema = z.object({
  username: z.string(),
  password: z.string(),
});
export type Login = z.infer<typeof LoginSchema>;

/**
 * Login response schema
 */
export const LoginResponseSchema = z.object({
  user: UserWithStaffSchema,
  token: z.string().nullable(),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

/**
 * Change password DTO schema
 */
export const ChangePasswordSchema = z.object({
  current_password: z.string(),
  new_password: z.string().min(8),
});
export type ChangePassword = z.infer<typeof ChangePasswordSchema>;

/**
 * Reset password DTO schema
 */
export const ResetPasswordSchema = z.object({
  new_password: z.string().min(8),
});
export type ResetPassword = z.infer<typeof ResetPasswordSchema>;

/**
 * User query filters schema
 */
export const UserQuerySchema = z.object({
  id: UserIdSchema.optional(),
  staff_id: UserIdSchema.optional(),
  username: z.string().optional(),
  email: z.string().optional(),
  role_id: UserIdSchema.optional(),
  status: UserStatusSchema.optional(),
  is_active: z.boolean().optional(),
  supervisor_id: UserIdSchema.optional(),
  include_deleted: z.boolean().optional(),
});
export type UserQuery = z.infer<typeof UserQuerySchema>;

/**
 * Pagination result schema
 */
export const PaginationResultSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    page_size: z.number(),
    total_pages: z.number(),
  });
export type PaginationResult<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

/**
 * Mutation result schema
 */
export const MutationResultSchema = z.object({
  id: UserIdSchema,
});
export type MutationResult = z.infer<typeof MutationResultSchema>;

/**
 * User statistics schema
 */
export const UserStatisticsSchema = z.object({
  total: z.number(),
  active: z.number(),
  inactive: z.number(),
  suspended: z.number(),
});
export type UserStatistics = z.infer<typeof UserStatisticsSchema>;

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Create a new user
 */
export async function createUser(data: CreateUser): Promise<MutationResult> {
  logger.info("Creating user:", data.username);
  return invokeCommand("create_user", MutationResultSchema, {
    params: { data },
  });
}

/**
 * Get user by ID
 */
export async function getUser(id: UserId): Promise<UserResponse> {
  logger.info("Getting user:", id);
  return invokeCommand("get_user", UserResponseSchema, { params: { id } });
}

/**
 * Update user
 */
export async function updateUser(
  id: UserId,
  data: UpdateUser,
): Promise<MutationResult> {
  logger.info("Updating user:", id);
  return invokeCommand("update_user", MutationResultSchema, {
    params: { id, data },
  });
}

/**
 * Delete user (soft delete)
 */
export async function deleteUser(
  id: UserId,
  deleted_by?: UserId,
): Promise<MutationResult> {
  logger.info("Deleting user:", id);
  return invokeCommand("delete_user", MutationResultSchema, {
    params: { id, deleted_by: deleted_by || null },
  });
}

/**
 * List users with filtering and pagination
 */
export async function listUsers(
  filter?: UserQuery,
  pagination?: PaginationParams,
): Promise<PaginationResult<UserResponse>> {
  logger.info("Listing users with filter:", filter);
  return invokeCommand(
    "list_users",
    PaginationResultSchema(UserResponseSchema),
    {
      params: {
        filter: filter || null,
        pagination: pagination || null,
      },
    },
  );
}

// ============================================================================
// Authentication & Security
// ============================================================================

/**
 * Authenticate user and get JWT token
 */
export async function loginUser(credentials: Login): Promise<LoginResponse> {
  logger.info("Logging in user:", credentials.username);
  return invokeCommand("login_user", LoginResponseSchema, {
    params: { data: credentials },
  });
}

/**
 * Change user password (requires current password)
 */
export async function changePassword(
  id: UserId,
  data: ChangePassword,
): Promise<MutationResult> {
  logger.info("Changing password for user:", id);
  return invokeCommand("change_password", MutationResultSchema, {
    params: { id, data },
  });
}

/**
 * Reset user password (admin operation)
 */
export async function resetPassword(
  id: UserId,
  data: ResetPassword,
): Promise<MutationResult> {
  logger.info("Resetting password for user:", id);
  return invokeCommand("reset_password", MutationResultSchema, {
    params: { id, data },
  });
}

// ============================================================================
// User Retrieval
// ============================================================================

/**
 * Get user by username
 */
export async function getUserByUsername(
  username: string,
): Promise<UserResponse> {
  logger.info("Getting user by username:", username);
  return invokeCommand("get_user_by_username", UserResponseSchema, {
    username,
  });
}

/**
 * Get user by staff ID
 */
export async function getUserByStaffId(
  staff_id: UserId,
): Promise<UserResponse> {
  logger.info("Getting user by staff ID:", staff_id);
  return invokeCommand("get_user_by_staff_id", UserResponseSchema, {
    staff_id,
  });
}

/**
 * Get user with full staff information
 */
export async function getUserWithStaff(id: UserId): Promise<UserWithStaff> {
  logger.info("Getting user with staff info:", id);
  return invokeCommand("get_user_with_staff", UserWithStaffSchema, {
    params: { id },
  });
}

/**
 * Get all active users
 */
export async function getActiveUsers(): Promise<UserResponse[]> {
  logger.info("Getting all active users");
  return invokeCommand("get_active_users", z.array(UserResponseSchema), {});
}

// ============================================================================
// User Management
// ============================================================================

/**
 * Restore a soft-deleted user
 */
export async function restoreUser(id: UserId): Promise<UserResponse> {
  logger.info("Restoring user:", id);
  return invokeCommand("restore_user", UserResponseSchema, { params: { id } });
}

/**
 * Permanently delete a user (hard delete - admin only)
 */
export async function deleteUserPermanently(
  id: UserId,
): Promise<MutationResult> {
  logger.warn("Permanently deleting user:", id);
  return invokeCommand("delete_user_permanently", MutationResultSchema, {
    params: { id },
  });
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get user statistics
 */
export async function getUserStatistics(): Promise<UserStatistics> {
  logger.info("Getting user statistics");
  return invokeCommand("get_user_statistics", UserStatisticsSchema, {});
}

// ============================================================================
// Exports
// ============================================================================

export const userApi = {
  // CRUD
  create: createUser,
  get: getUser,
  update: updateUser,
  delete: deleteUser,
  list: listUsers,

  // Auth
  login: loginUser,
  changePassword,
  resetPassword,

  // Retrieval
  getByUsername: getUserByUsername,
  getByStaffId: getUserByStaffId,
  getWithStaff: getUserWithStaff,
  getActive: getActiveUsers,

  // Management
  restore: restoreUser,
  deletePermanently: deleteUserPermanently,

  // Statistics
  getStatistics: getUserStatistics,
} as const;
