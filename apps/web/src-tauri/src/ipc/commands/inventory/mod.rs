use db_entity::inventory_item::dto::{
    CreateInventoryItemWithStock, InventoryItemWithStockResponse, UpdateInventoryItem,
};
use db_entity::inventory_stock::dto::{AdjustStock, UpdateInventoryStock};
use db_service::InventoryStatistics;
use tap::TapFallible;
use tauri::{AppHandle, Manager};

use crate::{
    error::AppResult,
    ipc::{
        params::{CreateParams, GetParams, UpdateParams},
        response::{IpcResponse, MutationResult},
    },
    state::AppState,
};

// ============================================================================
// Helper Functions
// ============================================================================

/// Helper to get inventory service from app state
#[inline]
fn get_inventory_service(app: &AppHandle) -> std::sync::Arc<db_service::InventoryService> {
    let state = app.state::<AppState>();
    let service_manager = state.service_manager();
    service_manager.inventory().clone()
}

// ============================================================================
// CRUD Operations (Catalog + Stock Combined)
// ============================================================================

/// Create a new inventory item with stock
#[tauri::command]
pub async fn create_inventory_item(
    app: AppHandle,
    params: CreateParams<CreateInventoryItemWithStock>,
) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        get_inventory_service(&app)
            .create(params.data().clone(), None)
            .await
            .tap_ok(|item| tracing::info!("Created inventory item: {} ({})", item.name, item.id))
            .tap_err(|e| tracing::error!("Failed to create inventory item: {}", e))
            .map(|item| MutationResult::from(item.id))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Get inventory item with stock by ID
#[tauri::command]
pub async fn get_inventory_item(
    app: AppHandle,
    params: GetParams,
) -> IpcResponse<InventoryItemWithStockResponse> {
    let result: AppResult<InventoryItemWithStockResponse> = async {
        get_inventory_service(&app)
            .get_by_id(*params.id())
            .await
            .tap_ok(|item| tracing::debug!("Retrieved inventory item: {} ({})", item.name, item.id))
            .tap_err(|e| tracing::error!("Failed to get inventory item {}: {}", params.id(), e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Get inventory item by barcode
#[tauri::command]
pub async fn get_inventory_item_by_barcode(
    app: AppHandle,
    barcode: String,
) -> IpcResponse<InventoryItemWithStockResponse> {
    let result: AppResult<InventoryItemWithStockResponse> = async {
        get_inventory_service(&app)
            .get_by_barcode(&barcode)
            .await
            .tap_ok(|item| {
                tracing::debug!(
                    "Retrieved inventory item by barcode {}: {}",
                    barcode,
                    item.name
                )
            })
            .tap_err(|e| {
                tracing::error!(
                    "Failed to get inventory item by barcode '{}': {}",
                    barcode,
                    e
                )
            })
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Update inventory item (catalog only)
#[tauri::command]
pub async fn update_inventory_item(
    app: AppHandle,
    params: UpdateParams<UpdateInventoryItem>,
) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        get_inventory_service(&app)
            .update(*params.id(), params.data().clone())
            .await
            .tap_ok(|item| tracing::info!("Updated inventory item: {} ({})", item.name, item.id))
            .tap_err(|e| tracing::error!("Failed to update inventory item {}: {}", params.id(), e))
            .map(|item| MutationResult::from(item.id))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Delete inventory item (soft delete)
#[tauri::command]
pub async fn delete_inventory_item(
    app: AppHandle,
    params: GetParams,
) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        get_inventory_service(&app)
            .delete(*params.id())
            .await
            .tap_ok(|_| tracing::info!("Deleted inventory item: {}", params.id()))
            .tap_err(|e| tracing::error!("Failed to delete inventory item {}: {}", params.id(), e))
            .map(|_| MutationResult::from(*params.id()))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Restore soft-deleted inventory item
#[tauri::command]
pub async fn restore_inventory_item(
    app: AppHandle,
    params: GetParams,
) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        get_inventory_service(&app)
            .restore(*params.id())
            .await
            .tap_ok(|item| tracing::info!("Restored inventory item: {} ({})", item.name, item.id))
            .tap_err(|e| tracing::error!("Failed to restore inventory item {}: {}", params.id(), e))
            .map(|item| MutationResult::from(item.id))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

// ============================================================================
// Stock Management Operations
// ============================================================================

/// Update stock (set absolute values)
#[tauri::command]
pub async fn update_inventory_stock(
    app: AppHandle,
    params: UpdateParams<UpdateInventoryStock>,
) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        get_inventory_service(&app)
            .update_stock(*params.id(), params.data().clone())
            .await
            .tap_ok(|stock| {
                tracing::info!(
                    "Updated stock for item {}: quantity={}",
                    stock.inventory_item_id,
                    stock.stock_quantity
                )
            })
            .tap_err(|e| tracing::error!("Failed to update stock for item {}: {}", params.id(), e))
            .map(|stock| MutationResult::from(stock.id))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Adjust stock (add or subtract)
#[tauri::command]
pub async fn adjust_inventory_stock(
    app: AppHandle,
    params: UpdateParams<AdjustStock>,
) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        get_inventory_service(&app)
            .adjust_stock(*params.id(), params.data().clone())
            .await
            .tap_ok(|stock| {
                tracing::info!(
                    "Adjusted stock for item {}: new quantity={}",
                    stock.inventory_item_id,
                    stock.stock_quantity
                )
            })
            .tap_err(|e| tracing::error!("Failed to adjust stock for item {}: {}", params.id(), e))
            .map(|stock| MutationResult::from(stock.id))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

// ============================================================================
// Listing & Filtering Operations
// ============================================================================

/// List all active inventory items with stock
#[tauri::command]
pub async fn list_active_inventory_items(
    app: AppHandle,
) -> IpcResponse<Vec<InventoryItemWithStockResponse>> {
    let result: AppResult<Vec<InventoryItemWithStockResponse>> = async {
        get_inventory_service(&app)
            .list_active()
            .await
            .tap_ok(|items| tracing::debug!("Listed {} active inventory items", items.len()))
            .tap_err(|e| tracing::error!("Failed to list active inventory items: {}", e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Get low stock items
#[tauri::command]
pub async fn get_low_stock_items(
    app: AppHandle,
) -> IpcResponse<Vec<InventoryItemWithStockResponse>> {
    let result: AppResult<Vec<InventoryItemWithStockResponse>> = async {
        get_inventory_service(&app)
            .get_low_stock()
            .await
            .tap_ok(|items| tracing::debug!("Found {} low stock items", items.len()))
            .tap_err(|e| tracing::error!("Failed to get low stock items: {}", e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Get out of stock items
#[tauri::command]
pub async fn get_out_of_stock_items(
    app: AppHandle,
) -> IpcResponse<Vec<InventoryItemWithStockResponse>> {
    let result: AppResult<Vec<InventoryItemWithStockResponse>> = async {
        get_inventory_service(&app)
            .get_out_of_stock()
            .await
            .tap_ok(|items| tracing::debug!("Found {} out of stock items", items.len()))
            .tap_err(|e| tracing::error!("Failed to get out of stock items: {}", e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Search inventory items by name, generic name, or barcode
#[tauri::command]
pub async fn search_inventory_items(
    app: AppHandle,
    search_term: String,
) -> IpcResponse<Vec<InventoryItemWithStockResponse>> {
    let result: AppResult<Vec<InventoryItemWithStockResponse>> = async {
        get_inventory_service(&app)
            .search(&search_term)
            .await
            .tap_ok(|items| tracing::debug!("Search '{}' found {} items", search_term, items.len()))
            .tap_err(|e| {
                tracing::error!("Failed to search inventory items '{}': {}", search_term, e)
            })
            .map_err(Into::into)
    }
    .await;
    result.into()
}

// ============================================================================
// Statistics
// ============================================================================

/// Get inventory statistics
#[tauri::command]
pub async fn get_inventory_statistics(app: AppHandle) -> IpcResponse<InventoryStatistics> {
    let result: AppResult<InventoryStatistics> = async {
        get_inventory_service(&app)
            .get_statistics()
            .await
            .tap_ok(|stats| {
                tracing::debug!(
                    "Retrieved inventory statistics: {} total items, {} low stock",
                    stats.total_items,
                    stats.low_stock_count
                )
            })
            .tap_err(|e| tracing::error!("Failed to get inventory statistics: {}", e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}
