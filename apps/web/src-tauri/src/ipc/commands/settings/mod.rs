use db_entity::setting::dto::{
    BoolValueDto, NumberValueDto, SetMultipleSettingsDto, SetSettingDto, SettingQueryDto,
    SettingResponseDto, StringValueDto,
};
use tap::TapFallible;
use tauri::{AppHandle, Manager};

use crate::{
    error::AppResult,
    ipc::{
        params::{CreateParams, GetParams, ListParams, UpdateParams},
        response::{IpcResponse, MutationResult},
    },
    state::AppState,
};

// ============================================================================
// Helper Functions
// ============================================================================

/// Helper to get settings service from app state
#[inline]
fn get_settings_service(app: &AppHandle) -> std::sync::Arc<db_service::SettingsService> {
    let state = app.state::<AppState>();
    let service_manager = state.service_manager();
    service_manager.settings().clone()
}

// ============================================================================
// CRUD Operations
// ============================================================================

/// Get a setting by ID
#[tauri::command]
pub async fn get_setting_by_id(
    app: AppHandle,
    params: GetParams,
) -> IpcResponse<SettingResponseDto> {
    let result: AppResult<SettingResponseDto> = async {
        get_settings_service(&app)
            .get_by_id(*params.id())
            .await
            .tap_ok(|setting| tracing::debug!("Retrieved setting by ID: {}", setting.id))
            .tap_err(|e| tracing::error!("Failed to get setting by ID {}: {}", params.id(), e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Get a setting by key
#[tauri::command]
pub async fn get_setting(app: AppHandle, key: String) -> IpcResponse<SettingResponseDto> {
    let result: AppResult<SettingResponseDto> = async {
        get_settings_service(&app)
            .get(&key)
            .await
            .tap_ok(|setting| tracing::debug!("Retrieved setting: {}", setting.key))
            .tap_err(|e| tracing::error!("Failed to get setting '{}': {}", key, e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Set a setting (create or update by key)
#[tauri::command]
pub async fn set_setting(
    app: AppHandle,
    params: CreateParams<SetSettingDto>,
) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        get_settings_service(&app)
            .set(params.data().clone())
            .await
            .tap_ok(|setting| tracing::info!("Set setting: {}", setting.key))
            .tap_err(|e| tracing::error!("Failed to set setting: {}", e))
            .map(|setting| MutationResult::from(setting.id))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Update a setting by ID
#[tauri::command]
pub async fn update_setting(
    app: AppHandle,
    params: UpdateParams<SetSettingDto>,
) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        get_settings_service(&app)
            .update(*params.id(), params.data().clone())
            .await
            .tap_ok(|setting| tracing::info!("Updated setting: {} ({})", setting.key, setting.id))
            .tap_err(|e| tracing::error!("Failed to update setting {}: {}", params.id(), e))
            .map(|setting| MutationResult::from(setting.id))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Delete a setting by ID
#[tauri::command]
pub async fn delete_setting_by_id(
    app: AppHandle,
    params: GetParams,
) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        let id = *params.id();
        get_settings_service(&app)
            .delete_by_id(id)
            .await
            .tap_ok(|_| tracing::info!("Deleted setting by ID: {}", id))
            .tap_err(|e| tracing::error!("Failed to delete setting by ID {}: {}", id, e))
            .map(|_| MutationResult::from(id))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Delete a setting by key
#[tauri::command]
pub async fn delete_setting(app: AppHandle, key: String) -> IpcResponse<()> {
    let result: AppResult<()> = async {
        get_settings_service(&app)
            .delete(&key)
            .await
            .tap_ok(|_| tracing::info!("Deleted setting: {}", key))
            .tap_err(|e| tracing::error!("Failed to delete setting '{}': {}", key, e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// List settings with optional filtering
#[tauri::command]
pub async fn list_settings(
    app: AppHandle,
    params: ListParams<SettingQueryDto>,
) -> IpcResponse<Vec<SettingResponseDto>> {
    let result: AppResult<Vec<SettingResponseDto>> = async {
        let query = params.filter().clone().unwrap_or_default();

        get_settings_service(&app)
            .list(query)
            .await
            .tap_ok(|settings| tracing::debug!("Listed {} settings", settings.len()))
            .tap_err(|e| tracing::error!("Failed to list settings: {}", e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

// ============================================================================
// Category Operations
// ============================================================================

/// Get all settings in a category
#[tauri::command]
pub async fn get_settings_by_category(
    app: AppHandle,
    category: String,
) -> IpcResponse<Vec<SettingResponseDto>> {
    let result: AppResult<Vec<SettingResponseDto>> = async {
        get_settings_service(&app)
            .get_by_category(&category)
            .await
            .tap_ok(|settings| {
                tracing::debug!(
                    "Retrieved {} settings in category '{}'",
                    settings.len(),
                    category
                )
            })
            .tap_err(|e| {
                tracing::error!("Failed to get settings by category '{}': {}", category, e)
            })
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Get all unique categories
#[tauri::command]
pub async fn get_setting_categories(app: AppHandle) -> IpcResponse<Vec<String>> {
    let result: AppResult<Vec<String>> = async {
        get_settings_service(&app)
            .get_categories()
            .await
            .tap_ok(|categories| tracing::debug!("Retrieved {} categories", categories.len()))
            .tap_err(|e| tracing::error!("Failed to get categories: {}", e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Delete all settings in a category
#[tauri::command]
pub async fn delete_setting_category(app: AppHandle, category: String) -> IpcResponse<u64> {
    let result: AppResult<u64> = async {
        get_settings_service(&app)
            .delete_category(&category)
            .await
            .tap_ok(|count| tracing::info!("Deleted {} settings in category '{}'", count, category))
            .tap_err(|e| tracing::error!("Failed to delete category '{}': {}", category, e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

// ============================================================================
// Bulk Operations
// ============================================================================

/// Set multiple settings at once
#[tauri::command]
pub async fn set_multiple_settings(
    app: AppHandle,
    params: CreateParams<SetMultipleSettingsDto>,
) -> IpcResponse<()> {
    let result: AppResult<()> = async {
        get_settings_service(&app)
            .set_multiple(params.data().clone())
            .await
            .tap_ok(|_| tracing::info!("Set multiple settings successfully"))
            .tap_err(|e| tracing::error!("Failed to set multiple settings: {}", e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

// ============================================================================
// Typed Getters
// ============================================================================

/// Get setting value as string
#[tauri::command]
pub async fn get_setting_string(app: AppHandle, key: String) -> IpcResponse<StringValueDto> {
    let result: AppResult<StringValueDto> = async {
        get_settings_service(&app)
            .get_string(&key)
            .await
            .tap_ok(|_| tracing::debug!("Retrieved string setting: {}", key))
            .tap_err(|e| tracing::error!("Failed to get string setting '{}': {}", key, e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Get setting value as boolean
#[tauri::command]
pub async fn get_setting_bool(app: AppHandle, key: String) -> IpcResponse<BoolValueDto> {
    let result: AppResult<BoolValueDto> = async {
        get_settings_service(&app)
            .get_bool(&key)
            .await
            .tap_ok(|_| tracing::debug!("Retrieved boolean setting: {}", key))
            .tap_err(|e| tracing::error!("Failed to get boolean setting '{}': {}", key, e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Get setting value as number
#[tauri::command]
pub async fn get_setting_number(app: AppHandle, key: String) -> IpcResponse<NumberValueDto> {
    let result: AppResult<NumberValueDto> = async {
        get_settings_service(&app)
            .get_number(&key)
            .await
            .tap_ok(|_| tracing::debug!("Retrieved number setting: {}", key))
            .tap_err(|e| tracing::error!("Failed to get number setting '{}': {}", key, e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

// ============================================================================
// Existence Checks
// ============================================================================

/// Check if a setting exists
#[tauri::command]
pub async fn setting_exists(app: AppHandle, key: String) -> IpcResponse<bool> {
    let result: AppResult<bool> = async {
        get_settings_service(&app)
            .exists(&key)
            .await
            .tap_ok(|exists| tracing::debug!("Setting '{}' exists: {}", key, exists))
            .tap_err(|e| tracing::error!("Failed to check if setting '{}' exists: {}", key, e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

// ============================================================================
// Statistics
// ============================================================================

/// Get settings statistics
#[tauri::command]
pub async fn get_settings_statistics(
    app: AppHandle,
) -> IpcResponse<db_service::SettingsStatistics> {
    let result: AppResult<db_service::SettingsStatistics> = async {
        get_settings_service(&app)
            .get_statistics()
            .await
            .tap_ok(|stats| {
                tracing::debug!(
                    "Settings statistics - Total: {}, Categories: {}",
                    stats.total,
                    stats.total_categories
                )
            })
            .tap_err(|e| tracing::error!("Failed to get settings statistics: {}", e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}
