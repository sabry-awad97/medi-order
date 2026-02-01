pub mod medicine_forms;
pub mod opening_balance;

// Re-export medicine forms commands
pub use medicine_forms::{
    create_medicine_form, delete_medicine_form, get_medicine_form, get_medicine_form_by_code,
    get_medicine_form_usage_count, list_active_medicine_forms, list_medicine_forms,
    medicine_form_exists, medicine_form_exists_by_code, reorder_medicine_forms,
    restore_medicine_form, update_medicine_form,
};

// Re-export opening balance commands
pub use opening_balance::{
    create_opening_balance, create_opening_balance_adjustment, delete_opening_balance,
    get_opening_balance, get_opening_balance_statistics, get_opening_balances_by_batch,
    get_opening_balances_by_item, get_unverified_opening_balances, list_opening_balances,
    reject_opening_balance, update_opening_balance, verify_opening_balance,
};

use db_entity::inventory_item::dto::{
    CreateBarcodeInput, CreateInventoryItemWithStock, InventoryItemWithStockResponse,
    SetPrimaryBarcode, UpdateInventoryItem,
};
use db_entity::inventory_item_barcode::dto::InventoryItemBarcodeResponse;
use db_entity::inventory_price_history::dto::{
    PriceHistoryQueryDto, PriceHistoryResponse, PriceStatistics,
};
use db_entity::inventory_stock::dto::{AdjustStock, UpdateInventoryStock};
use db_entity::inventory_stock_history::dto::{
    StockHistoryQueryDto, StockHistoryResponse, StockHistoryStatistics,
};
use db_service::InventoryStatistics;
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

// ============================================================================
// Barcode Management Operations
// ============================================================================

/// Get all barcodes for an inventory item
#[tauri::command]
pub async fn get_item_barcodes(
    app: AppHandle,
    params: GetParams,
) -> IpcResponse<Vec<InventoryItemBarcodeResponse>> {
    let result: AppResult<Vec<InventoryItemBarcodeResponse>> = async {
        get_inventory_service(&app)
            .get_item_barcodes(*params.id())
            .await
            .tap_ok(|barcodes| {
                tracing::debug!(
                    "Retrieved {} barcodes for item {}",
                    barcodes.len(),
                    params.id()
                )
            })
            .tap_err(|e| tracing::error!("Failed to get barcodes for item {}: {}", params.id(), e))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Add a barcode to an inventory item
#[tauri::command]
pub async fn add_barcode(
    app: AppHandle,
    params: UpdateParams<CreateBarcodeInput>,
) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        let data = params.data();
        get_inventory_service(&app)
            .add_barcode(
                *params.id(),
                data.barcode.clone(),
                data.barcode_type.clone(),
                data.is_primary,
                data.description.clone(),
                None,
            )
            .await
            .tap_ok(|barcode_id| {
                tracing::info!("Added barcode {} to item {}", barcode_id, params.id())
            })
            .tap_err(|e| tracing::error!("Failed to add barcode to item {}: {}", params.id(), e))
            .map(MutationResult::from)
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Remove a barcode
#[tauri::command]
pub async fn remove_barcode(app: AppHandle, params: GetParams) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        get_inventory_service(&app)
            .remove_barcode(*params.id())
            .await
            .tap_ok(|_| tracing::info!("Removed barcode: {}", params.id()))
            .tap_err(|e| tracing::error!("Failed to remove barcode {}: {}", params.id(), e))
            .map(|_| MutationResult::from(*params.id()))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Set a barcode as primary
#[tauri::command]
pub async fn set_primary_barcode(
    app: AppHandle,
    params: UpdateParams<SetPrimaryBarcode>,
) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        get_inventory_service(&app)
            .set_primary_barcode(*params.id(), params.data().barcode_id)
            .await
            .tap_ok(|_| {
                tracing::info!(
                    "Set barcode {} as primary for item {}",
                    params.data().barcode_id,
                    params.id()
                )
            })
            .tap_err(|e| {
                tracing::error!(
                    "Failed to set barcode {} as primary for item {}: {}",
                    params.data().barcode_id,
                    params.id(),
                    e
                )
            })
            .map(|_| MutationResult::from(params.data().barcode_id))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Update a barcode
#[tauri::command]
pub async fn update_barcode(
    app: AppHandle,
    params: UpdateParams<CreateBarcodeInput>,
) -> IpcResponse<MutationResult> {
    let result: AppResult<MutationResult> = async {
        let data = params.data();
        get_inventory_service(&app)
            .update_barcode(
                *params.id(),
                Some(data.barcode.clone()),
                data.barcode_type.clone(),
                data.description.clone(),
            )
            .await
            .tap_ok(|_| tracing::info!("Updated barcode: {}", params.id()))
            .tap_err(|e| tracing::error!("Failed to update barcode {}: {}", params.id(), e))
            .map(|_| MutationResult::from(*params.id()))
            .map_err(Into::into)
    }
    .await;
    result.into()
}

// ============================================================================
// Price History Operations
// ============================================================================

/// Helper to get price history service from app state
#[inline]
fn get_price_history_service(app: &AppHandle) -> std::sync::Arc<db_service::PriceHistoryService> {
    let state = app.state::<AppState>();
    let service_manager = state.service_manager();
    service_manager.price_history().clone()
}

/// Get price history for an inventory item
#[tauri::command]
pub async fn get_price_history(
    app: AppHandle,
    params: ListParams<PriceHistoryQueryDto>,
) -> IpcResponse<Vec<PriceHistoryResponse>> {
    let result: AppResult<Vec<PriceHistoryResponse>> = async {
        let query = params.filter().clone().unwrap_or_default();

        get_price_history_service(&app)
            .get_price_history(query.inventory_item_id, query.limit)
            .await
            .tap_ok(|entries| {
                tracing::debug!(
                    "Retrieved {} price history entries for item {}",
                    entries.len(),
                    query.inventory_item_id
                )
            })
            .tap_err(|e| {
                tracing::error!(
                    "Failed to get price history for item {}: {}",
                    query.inventory_item_id,
                    e
                )
            })
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Get the latest price for an inventory item
#[tauri::command]
pub async fn get_latest_price(
    app: AppHandle,
    params: GetParams,
) -> IpcResponse<Option<PriceHistoryResponse>> {
    let result: AppResult<Option<PriceHistoryResponse>> = async {
        get_price_history_service(&app)
            .get_latest_price(*params.id())
            .await
            .tap_ok(|entry| {
                if entry.is_some() {
                    tracing::debug!("Retrieved latest price for item {}", params.id());
                } else {
                    tracing::debug!("No price history found for item {}", params.id());
                }
            })
            .tap_err(|e| {
                tracing::error!("Failed to get latest price for item {}: {}", params.id(), e)
            })
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Get price statistics for an inventory item
#[tauri::command]
pub async fn get_price_statistics(
    app: AppHandle,
    params: GetParams,
) -> IpcResponse<PriceStatistics> {
    let result: AppResult<PriceStatistics> = async {
        get_price_history_service(&app)
            .get_price_statistics(*params.id())
            .await
            .tap_ok(|stats| {
                tracing::debug!(
                    "Retrieved price statistics for item {}: min={}, max={}, avg={}",
                    params.id(),
                    stats.min_price,
                    stats.max_price,
                    stats.avg_price
                )
            })
            .tap_err(|e| {
                tracing::error!(
                    "Failed to get price statistics for item {}: {}",
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
// Stock History Operations
// ============================================================================

/// Helper to get stock history service from app state
#[inline]
fn get_stock_history_service(app: &AppHandle) -> std::sync::Arc<db_service::StockHistoryService> {
    let state = app.state::<AppState>();
    let service_manager = state.service_manager();
    service_manager.stock_history().clone()
}

/// Get stock history for an inventory item
#[tauri::command]
pub async fn get_stock_history(
    app: AppHandle,
    params: ListParams<StockHistoryQueryDto>,
) -> IpcResponse<Vec<StockHistoryResponse>> {
    let result: AppResult<Vec<StockHistoryResponse>> = async {
        let query = params.filter().clone().unwrap_or_default();

        get_stock_history_service(&app)
            .get_stock_history(query.inventory_item_id, query.limit)
            .await
            .tap_ok(|entries| {
                tracing::debug!(
                    "Retrieved {} stock history entries for item {}",
                    entries.len(),
                    query.inventory_item_id
                )
            })
            .tap_err(|e| {
                tracing::error!(
                    "Failed to get stock history for item {}: {}",
                    query.inventory_item_id,
                    e
                )
            })
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Get the latest stock adjustment for an inventory item
#[tauri::command]
pub async fn get_latest_stock_adjustment(
    app: AppHandle,
    params: GetParams,
) -> IpcResponse<Option<StockHistoryResponse>> {
    let result: AppResult<Option<StockHistoryResponse>> = async {
        get_stock_history_service(&app)
            .get_latest_adjustment(*params.id())
            .await
            .tap_ok(|entry| {
                if entry.is_some() {
                    tracing::debug!("Retrieved latest stock adjustment for item {}", params.id());
                } else {
                    tracing::debug!("No stock history found for item {}", params.id());
                }
            })
            .tap_err(|e| {
                tracing::error!(
                    "Failed to get latest stock adjustment for item {}: {}",
                    params.id(),
                    e
                )
            })
            .map_err(Into::into)
    }
    .await;
    result.into()
}

/// Get stock history statistics for an inventory item
#[tauri::command]
pub async fn get_stock_history_statistics(
    app: AppHandle,
    params: GetParams,
) -> IpcResponse<StockHistoryStatistics> {
    let result: AppResult<StockHistoryStatistics> = async {
        get_stock_history_service(&app)
            .get_stock_history_statistics(*params.id())
            .await
            .tap_ok(|stats| {
                tracing::debug!(
                    "Retrieved stock history statistics for item {}: total={}, added={}, removed={}, net={}",
                    params.id(),
                    stats.total_adjustments,
                    stats.total_added,
                    stats.total_removed,
                    stats.net_change
                )
            })
            .tap_err(|e| {
                tracing::error!(
                    "Failed to get stock history statistics for item {}: {}",
                    params.id(),
                    e
                )
            })
            .map_err(Into::into)
    }
    .await;
    result.into()
}
