use db_entity::id::Id;
use db_entity::inventory_opening_balance::dto::{
    CreateOpeningBalanceDto, OpeningBalanceQueryDto, OpeningBalanceResponse,
    OpeningBalanceStatistics, UpdateOpeningBalanceDto,
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

/// Helper to get opening balance service from app state
#[inline]
fn get_opening_balance_service(
    app: &AppHandle,
) -> std::sync::Arc<db_service::OpeningBalanceService> {
    let state = app.state::<AppState>();
    let service_manager = state.service_manager();
    service_manager.opening_balance().clone()
}

// ============================================================================
// CRUD Operations
// ============================================================================

/// Create a new opening balance entry
#[tauri::command]
pub async fn create_opening_balance(
    app: AppHandle,
    params: CreateParams<(CreateOpeningBalanceDto, Id)>,
) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        let (dto, entered_by) = params.data().clone();
        get_opening_balance_service(&app)
            .create(dto, entered_by)
            .await
            .tap_ok(|entry| {
                tracing::info!(
                    "Created opening balance entry: {} for item {}",
                    entry.id,
                    entry.inventory_item_id
                )
            })
            .tap_err(|e| tracing::error!("Failed to create opening balance: {}", e))
            .map(|entry| MutationResult::from(entry.id))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Get an opening balance entry by ID
#[tauri::command]
pub async fn get_opening_balance(
    app: AppHandle,
    params: GetParams,
) -> IpcResponse<OpeningBalanceResponse> {
    let result: AppResult<OpeningBalanceResponse> = async {
        get_opening_balance_service(&app)
            .get_by_id(*params.id())
            .await
            .tap_ok(|entry| {
                tracing::debug!(
                    "Retrieved opening balance entry: {} for item {}",
                    entry.id,
                    entry.inventory_item_id
                )
            })
            .tap_err(|e| tracing::error!("Failed to get opening balance {}: {}", params.id(), e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// List opening balance entries with filtering
#[tauri::command]
pub async fn list_opening_balances(
    app: AppHandle,
    params: ListParams<OpeningBalanceQueryDto>,
) -> IpcResponse<db_service::PaginationResult<OpeningBalanceResponse>> {
    let result: AppResult<db_service::PaginationResult<OpeningBalanceResponse>> = async {
        let query = params.filter().clone().unwrap_or_default();

        get_opening_balance_service(&app)
            .list(query, *params.pagination())
            .await
            .tap_ok(|result| {
                tracing::debug!(
                    "Listed {} opening balance entries (page {}/{})",
                    result.items_ref().len(),
                    result.page(),
                    result.total_pages()
                )
            })
            .tap_err(|e| tracing::error!("Failed to list opening balances: {}", e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Update an opening balance entry
#[tauri::command]
pub async fn update_opening_balance(
    app: AppHandle,
    params: UpdateParams<UpdateOpeningBalanceDto>,
) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        get_opening_balance_service(&app)
            .update(*params.id(), params.data().clone())
            .await
            .tap_ok(|entry| {
                tracing::info!(
                    "Updated opening balance entry: {} for item {}",
                    entry.id,
                    entry.inventory_item_id
                )
            })
            .tap_err(|e| tracing::error!("Failed to update opening balance {}: {}", params.id(), e))
            .map(|entry| MutationResult::from(entry.id))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Delete an opening balance entry (soft delete)
#[tauri::command]
pub async fn delete_opening_balance(
    app: AppHandle,
    params: UpdateParams<String>,
) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        let reason = params.data().clone();
        get_opening_balance_service(&app)
            .reject(*params.id(), reason)
            .await
            .tap_ok(|_| tracing::info!("Deleted opening balance entry: {}", params.id()))
            .tap_err(|e| tracing::error!("Failed to delete opening balance {}: {}", params.id(), e))
            .map(|_| MutationResult::from(*params.id()))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

// ============================================================================
// Verification Workflow Operations
// ============================================================================

/// Verify an opening balance entry
#[tauri::command]
pub async fn verify_opening_balance(
    app: AppHandle,
    params: UpdateParams<Id>,
) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        get_opening_balance_service(&app)
            .verify(*params.id(), *params.data())
            .await
            .tap_ok(|entry| {
                tracing::info!(
                    "Verified opening balance entry: {} for item {}",
                    entry.id,
                    entry.inventory_item_id
                )
            })
            .tap_err(|e| tracing::error!("Failed to verify opening balance {}: {}", params.id(), e))
            .map(|entry| MutationResult::from(entry.id))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Reject an opening balance entry
#[tauri::command]
pub async fn reject_opening_balance(
    app: AppHandle,
    params: UpdateParams<String>,
) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        let reason = params.data().clone();
        get_opening_balance_service(&app)
            .reject(*params.id(), reason)
            .await
            .tap_ok(|_| tracing::info!("Rejected opening balance entry: {}", params.id()))
            .tap_err(|e| tracing::error!("Failed to reject opening balance {}: {}", params.id(), e))
            .map(|_| MutationResult::from(*params.id()))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

// ============================================================================
// Adjustment Operations
// ============================================================================

/// Create an adjustment to an opening balance entry
#[tauri::command]
pub async fn create_opening_balance_adjustment(
    app: AppHandle,
    params: CreateParams<(
        db_entity::inventory_opening_balance::dto::CreateAdjustmentDto,
        Id,
    )>,
) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        let (dto, entered_by) = params.data().clone();
        get_opening_balance_service(&app)
            .create_adjustment(dto, entered_by)
            .await
            .tap_ok(|entry| {
                tracing::info!("Created adjustment {} for opening balance entry", entry.id)
            })
            .tap_err(|e| tracing::error!("Failed to create adjustment for opening balance: {}", e))
            .map(|entry| MutationResult::from(entry.id))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

// ============================================================================
// Query Operations
// ============================================================================

/// Get all opening balance entries for a specific inventory item
#[tauri::command]
pub async fn get_opening_balances_by_item(
    app: AppHandle,
    params: GetParams,
) -> IpcResponse<Vec<OpeningBalanceResponse>> {
    let result: AppResult<Vec<OpeningBalanceResponse>> = async {
        get_opening_balance_service(&app)
            .get_by_item(*params.id())
            .await
            .tap_ok(|entries| {
                tracing::debug!(
                    "Retrieved {} opening balance entries for item {}",
                    entries.len(),
                    params.id()
                )
            })
            .tap_err(|e| {
                tracing::error!(
                    "Failed to get opening balances for item {}: {}",
                    params.id(),
                    e
                )
            })
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Get all unverified opening balance entries
#[tauri::command]
pub async fn get_unverified_opening_balances(
    app: AppHandle,
) -> IpcResponse<Vec<OpeningBalanceResponse>> {
    let result: AppResult<Vec<OpeningBalanceResponse>> = async {
        get_opening_balance_service(&app)
            .get_unverified()
            .await
            .tap_ok(|entries| {
                tracing::debug!(
                    "Retrieved {} unverified opening balance entries",
                    entries.len()
                )
            })
            .tap_err(|e| tracing::error!("Failed to get unverified opening balances: {}", e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Get opening balance entries by import batch ID
#[tauri::command]
pub async fn get_opening_balances_by_batch(
    app: AppHandle,
    params: GetParams,
) -> IpcResponse<Vec<OpeningBalanceResponse>> {
    let result: AppResult<Vec<OpeningBalanceResponse>> = async {
        get_opening_balance_service(&app)
            .get_by_import_batch(*params.id())
            .await
            .tap_ok(|entries| {
                tracing::debug!(
                    "Retrieved {} opening balance entries for batch {}",
                    entries.len(),
                    params.id()
                )
            })
            .tap_err(|e| {
                tracing::error!(
                    "Failed to get opening balances for batch {}: {}",
                    params.id(),
                    e
                )
            })
            .map_err(Into::into)
    }
    .await;
    result.into()
}

// ============================================================================
// Statistics Operations
// ============================================================================

/// Get opening balance statistics
#[tauri::command]
pub async fn get_opening_balance_statistics(
    app: AppHandle,
) -> IpcResponse<OpeningBalanceStatistics> {
    let result: AppResult<OpeningBalanceStatistics> = async {
        get_opening_balance_service(&app)
            .get_statistics()
            .await
            .tap_ok(|stats| {
                tracing::debug!(
                    "Retrieved opening balance statistics: {} total, {} verified, {} pending",
                    stats.total_entries,
                    stats.verified_entries,
                    stats.pending_verification
                )
            })
            .tap_err(|e| tracing::error!("Failed to get opening balance statistics: {}", e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}
