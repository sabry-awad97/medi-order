use db_entity::id::Id;
use db_entity::user::dto::{
    ChangePasswordDto, CreateUserDto, LoginDto, LoginResponseDto, ResetPasswordDto, UpdateUserDto,
    UserQueryDto, UserResponseDto, UserWithStaffDto,
};
use tap::TapFallible;
use tauri::{AppHandle, Manager};

use crate::{
    error::AppResult,
    ipc::{
        params::{CreateParams, DeleteParams, GetParams, ListParams, UpdateParams},
        response::{IpcResponse, MutationResult},
    },
    state::AppState,
};

// ============================================================================
// Helper Functions
// ============================================================================

/// Helper to get user service from app state
#[inline]
fn get_user_service(app: &AppHandle) -> std::sync::Arc<db_service::UserService> {
    let state = app.state::<AppState>();
    let service_manager = state.service_manager();
    service_manager.user().clone()
}

// ============================================================================
// CRUD Operations
// ============================================================================

/// Create a new user
#[tauri::command]
pub async fn create_user(
    app: AppHandle,
    params: CreateParams<CreateUserDto>,
) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        get_user_service(&app)
            .create(params.data().clone())
            .await
            .tap_ok(|user| tracing::info!("Created user: {} ({})", user.username, user.id))
            .tap_err(|e| tracing::error!("Failed to create user: {}", e))
            .map(|user| MutationResult::from(user.id))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Get a user by ID
#[tauri::command]
pub async fn get_user(app: AppHandle, params: GetParams) -> IpcResponse<UserResponseDto> {
    let result: AppResult<UserResponseDto> = async {
        get_user_service(&app)
            .get_by_id(*params.id())
            .await
            .tap_ok(|user| tracing::debug!("Retrieved user: {} ({})", user.username, user.id))
            .tap_err(|e| tracing::error!("Failed to get user {}: {}", params.id(), e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// List users with filtering and optional pagination
#[tauri::command]
pub async fn list_users(
    app: AppHandle,
    params: ListParams<UserQueryDto>,
) -> IpcResponse<db_service::PaginationResult<UserResponseDto>> {
    let result: AppResult<db_service::PaginationResult<UserResponseDto>> = async {
        let query = params.filter().clone().unwrap_or_default();

        get_user_service(&app)
            .list(query, *params.pagination())
            .await
            .tap_ok(|result| {
                tracing::debug!(
                    "Listed {} users (page {}/{})",
                    result.items_ref().len(),
                    result.page(),
                    result.total_pages()
                )
            })
            .tap_err(|e| tracing::error!("Failed to list users: {}", e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Update a user
#[tauri::command]
pub async fn update_user(
    app: AppHandle,
    params: UpdateParams<UpdateUserDto>,
) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        get_user_service(&app)
            .update(*params.id(), params.data().clone())
            .await
            .tap_ok(|user| tracing::info!("Updated user: {} ({})", user.username, user.id))
            .tap_err(|e| tracing::error!("Failed to update user {}: {}", params.id(), e))
            .map(|user| MutationResult::from(user.id))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Delete a user (soft delete)
#[tauri::command]
pub async fn delete_user(app: AppHandle, params: DeleteParams) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        let user_id = *params.id();
        let delete_dto = db_entity::user::dto::DeleteUserDto {
            deleted_by: *params.deleted_by(),
        };

        get_user_service(&app)
            .delete(user_id, delete_dto)
            .await
            .tap_ok(|_| tracing::info!("Soft deleted user: {}", user_id))
            .tap_err(|e| tracing::error!("Failed to delete user {}: {}", user_id, e))
            .map(|_| MutationResult::from(user_id))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

// ============================================================================
// Authentication & Security Commands
// ============================================================================

/// Authenticate user and create session
#[tauri::command]
pub async fn login_user(
    app: AppHandle,
    params: CreateParams<LoginDto>,
) -> IpcResponse<LoginResponseDto> {
    let result: AppResult<LoginResponseDto> = async {
        // Authenticate user
        let mut login_response = get_user_service(&app)
            .login(params.data().clone())
            .await
            .tap_ok(|response| {
                tracing::info!(
                    "User authenticated: {} ({})",
                    response.user.username,
                    response.user.id
                )
            })
            .tap_err(|e| tracing::warn!("Login failed: {}", e))?;

        // Create session for the user
        let state = app.state::<AppState>();
        let service_manager = state.service_manager();
        let session_service = service_manager.session();

        let session = session_service
            .create_session(login_response.user.id, None, None)
            .await
            .tap_ok(|session| {
                tracing::info!(
                    "Session created for user: {} (session expires at: {})",
                    login_response.user.id,
                    session.expires_at
                )
            })
            .tap_err(|e| tracing::error!("Failed to create session: {}", e))?;

        // Replace JWT token with session token
        login_response.token = Some(session.token);

        Ok(login_response)
    }
    .await;
    result.into()
}

/// Change user password (requires current password verification)
#[tauri::command]
pub async fn change_password(
    app: AppHandle,
    params: UpdateParams<ChangePasswordDto>,
) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        let user_id = *params.id();

        get_user_service(&app)
            .change_password(user_id, params.data().clone())
            .await
            .tap_ok(|_| tracing::info!("Password changed for user: {}", user_id))
            .tap_err(|e| tracing::error!("Failed to change password for user {}: {}", user_id, e))
            .map(|_| MutationResult::from(user_id))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Reset user password (admin operation, no current password required)
#[tauri::command]
pub async fn reset_password(
    app: AppHandle,
    params: UpdateParams<ResetPasswordDto>,
) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        let user_id = *params.id();

        get_user_service(&app)
            .reset_password(user_id, params.data().clone())
            .await
            .tap_ok(|_| tracing::warn!("Admin reset password for user: {}", user_id))
            .tap_err(|e| tracing::error!("Failed to reset password for user {}: {}", user_id, e))
            .map(|_| MutationResult::from(user_id))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

// ============================================================================
// User Retrieval Commands
// ============================================================================

/// Get user by username
#[tauri::command]
pub async fn get_user_by_username(
    app: AppHandle,
    username: String,
) -> IpcResponse<UserResponseDto> {
    let result: AppResult<UserResponseDto> = async {
        get_user_service(&app)
            .get_by_username(&username)
            .await
            .tap_ok(|user| {
                tracing::debug!("Retrieved user by username '{}': {}", username, user.id)
            })
            .tap_err(|e| tracing::error!("Failed to get user by username '{}': {}", username, e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Get user by staff ID
#[tauri::command]
pub async fn get_user_by_staff_id(app: AppHandle, staff_id: Id) -> IpcResponse<UserResponseDto> {
    let result: AppResult<UserResponseDto> = async {
        get_user_service(&app)
            .get_by_staff_id(staff_id)
            .await
            .tap_ok(|user| tracing::debug!("Retrieved user by staff ID {}: {}", staff_id, user.id))
            .tap_err(|e| tracing::error!("Failed to get user by staff ID {}: {}", staff_id, e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Get user with full staff information
#[tauri::command]
pub async fn get_user_with_staff(
    app: AppHandle,
    params: GetParams,
) -> IpcResponse<UserWithStaffDto> {
    let result: AppResult<UserWithStaffDto> = async {
        get_user_service(&app)
            .get_with_staff(*params.id())
            .await
            .tap_ok(|user| {
                tracing::debug!(
                    "Retrieved user with staff info: {} - {}",
                    user.username,
                    user.staff_full_name
                )
            })
            .tap_err(|e| tracing::error!("Failed to get user with staff {}: {}", params.id(), e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Get all active users
#[tauri::command]
pub async fn get_active_users(app: AppHandle) -> IpcResponse<Vec<UserResponseDto>> {
    let result: AppResult<Vec<UserResponseDto>> = async {
        get_user_service(&app)
            .get_active()
            .await
            .tap_ok(|users| tracing::debug!("Retrieved {} active users", users.len()))
            .tap_err(|e| tracing::error!("Failed to get active users: {}", e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

// ============================================================================
// User Management Commands
// ============================================================================

/// Restore a soft-deleted user
#[tauri::command]
pub async fn restore_user(app: AppHandle, params: GetParams) -> IpcResponse<UserResponseDto> {
    let result: AppResult<UserResponseDto> = async {
        get_user_service(&app)
            .restore(*params.id())
            .await
            .tap_ok(|user| tracing::info!("Restored user: {} ({})", user.username, user.id))
            .tap_err(|e| tracing::error!("Failed to restore user {}: {}", params.id(), e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Permanently delete a user (hard delete - admin only)
#[tauri::command]
pub async fn delete_user_permanently(
    app: AppHandle,
    params: GetParams,
) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        let user_id = *params.id();

        get_user_service(&app)
            .delete_permanently(user_id)
            .await
            .tap_ok(|_| tracing::warn!("Permanently deleted user: {}", user_id))
            .tap_err(|e| tracing::error!("Failed to permanently delete user {}: {}", user_id, e))
            .map(|_| MutationResult::from(user_id))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

// ============================================================================
// Statistics Commands
// ============================================================================

/// Get user statistics (total, active, inactive, suspended)
#[tauri::command]
pub async fn get_user_statistics(app: AppHandle) -> IpcResponse<db_service::UserStatistics> {
    let result: AppResult<db_service::UserStatistics> = async {
        get_user_service(&app)
            .get_statistics()
            .await
            .tap_ok(|stats| {
                tracing::debug!(
                    "User statistics - Total: {}, Active: {}, Inactive: {}, Suspended: {}",
                    stats.total,
                    stats.active,
                    stats.inactive,
                    stats.suspended
                )
            })
            .tap_err(|e| tracing::error!("Failed to get user statistics: {}", e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}
