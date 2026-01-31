use db_entity::manufacturer::dto::*;
use tap::TapFallible;
use tauri::{AppHandle, Manager};

use crate::{
    error::AppResult,
    ipc::{
        params::{CreateParams, DeleteParams, GetParams, UpdateParams},
        response::{IpcResponse, MutationResult},
    },
    state::AppState,
};

// ============================================================================
// Helper Functions
// ============================================================================

/// Helper to get manufacturer service from app state
#[inline]
fn get_manufacturer_service(app: &AppHandle) -> std::sync::Arc<db_service::ManufacturerService> {
    let state = app.state::<AppState>();
    let service_manager = state.service_manager();
    service_manager.manufacturer().clone()
}

// ============================================================================
// CRUD Operations
// ============================================================================

/// Create a new manufacturer
#[tauri::command]
pub async fn create_manufacturer(
    app: AppHandle,
    params: CreateParams<CreateManufacturer>,
) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        get_manufacturer_service(&app)
            .create(params.data().clone())
            .await
            .tap_ok(|manufacturer| {
                tracing::info!(
                    "Created manufacturer: {} ({})",
                    manufacturer.name,
                    manufacturer.id
                )
            })
            .tap_err(|e| tracing::error!("Failed to create manufacturer: {}", e))
            .map(|manufacturer| MutationResult::from(manufacturer.id))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Create multiple manufacturers in bulk (optimized for seeding/imports)
#[tauri::command]
pub async fn create_manufacturers_bulk(
    app: AppHandle,
    data: Vec<CreateManufacturer>,
) -> IpcResponse<Vec<MutationResult>> {
    let result: AppResult<Vec<MutationResult>> = async {
        get_manufacturer_service(&app)
            .create_bulk(data)
            .await
            .tap_ok(|manufacturers| {
                tracing::info!("Bulk created {} manufacturers", manufacturers.len())
            })
            .tap_err(|e| tracing::error!("Failed to bulk create manufacturers: {}", e))
            .map(|manufacturers| {
                manufacturers
                    .into_iter()
                    .map(|m| MutationResult::from(m.id))
                    .collect()
            })
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Get a manufacturer by ID
#[tauri::command]
pub async fn get_manufacturer(
    app: AppHandle,
    params: GetParams,
) -> IpcResponse<ManufacturerResponse> {
    let result: AppResult<ManufacturerResponse> = async {
        get_manufacturer_service(&app)
            .get_by_id(*params.id())
            .await
            .tap_ok(|manufacturer| {
                tracing::debug!(
                    "Retrieved manufacturer: {} ({})",
                    manufacturer.name,
                    manufacturer.id
                )
            })
            .tap_err(|e| tracing::error!("Failed to get manufacturer {}: {}", params.id(), e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Update a manufacturer
#[tauri::command]
pub async fn update_manufacturer(
    app: AppHandle,
    params: UpdateParams<UpdateManufacturer>,
) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        get_manufacturer_service(&app)
            .update(*params.id(), params.data().clone())
            .await
            .tap_ok(|manufacturer| {
                tracing::info!(
                    "Updated manufacturer: {} ({})",
                    manufacturer.name,
                    manufacturer.id
                )
            })
            .tap_err(|e| tracing::error!("Failed to update manufacturer {}: {}", params.id(), e))
            .map(|manufacturer| MutationResult::from(manufacturer.id))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Delete a manufacturer (soft delete)
#[tauri::command]
pub async fn delete_manufacturer(
    app: AppHandle,
    params: DeleteParams,
) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        let manufacturer_id = *params.id();

        get_manufacturer_service(&app)
            .delete(manufacturer_id)
            .await
            .tap_ok(|_| tracing::info!("Soft deleted manufacturer: {}", manufacturer_id))
            .tap_err(|e| {
                tracing::error!("Failed to delete manufacturer {}: {}", manufacturer_id, e)
            })
            .map(|_| MutationResult::from(manufacturer_id))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

// ============================================================================
// Retrieval Commands
// ============================================================================

/// Get a manufacturer by name
#[tauri::command]
pub async fn get_manufacturer_by_name(
    app: AppHandle,
    name: String,
) -> IpcResponse<ManufacturerResponse> {
    let result: AppResult<ManufacturerResponse> = async {
        get_manufacturer_service(&app)
            .get_by_name(&name)
            .await
            .tap_ok(|manufacturer| {
                tracing::debug!(
                    "Retrieved manufacturer by name '{}': {}",
                    name,
                    manufacturer.id
                )
            })
            .tap_err(|e| tracing::error!("Failed to get manufacturer by name '{}': {}", name, e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// List all manufacturers with optional filtering
#[tauri::command]
pub async fn list_manufacturers(
    app: AppHandle,
    active_only: bool,
) -> IpcResponse<Vec<ManufacturerResponse>> {
    let result: AppResult<Vec<ManufacturerResponse>> = async {
        get_manufacturer_service(&app)
            .list(active_only)
            .await
            .tap_ok(|manufacturers| tracing::debug!("Listed {} manufacturers", manufacturers.len()))
            .tap_err(|e| tracing::error!("Failed to list manufacturers: {}", e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// List active manufacturers (for dropdowns)
#[tauri::command]
pub async fn list_active_manufacturers(app: AppHandle) -> IpcResponse<Vec<ManufacturerResponse>> {
    let result: AppResult<Vec<ManufacturerResponse>> = async {
        get_manufacturer_service(&app)
            .list_active()
            .await
            .tap_ok(|manufacturers| {
                tracing::debug!("Listed {} active manufacturers", manufacturers.len())
            })
            .tap_err(|e| tracing::error!("Failed to list active manufacturers: {}", e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

// ============================================================================
// Management Commands
// ============================================================================

/// Permanently delete a manufacturer (hard delete - admin only)
#[tauri::command]
pub async fn hard_delete_manufacturer(
    app: AppHandle,
    params: GetParams,
) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        let manufacturer_id = *params.id();

        get_manufacturer_service(&app)
            .hard_delete(manufacturer_id)
            .await
            .tap_ok(|_| tracing::warn!("Permanently deleted manufacturer: {}", manufacturer_id))
            .tap_err(|e| {
                tracing::error!(
                    "Failed to permanently delete manufacturer {}: {}",
                    manufacturer_id,
                    e
                )
            })
            .map(|_| MutationResult::from(manufacturer_id))
            .map_err(Into::into)
    }
    .await;
    result.into()
}
