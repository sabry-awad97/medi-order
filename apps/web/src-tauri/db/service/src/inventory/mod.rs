use std::sync::Arc;

use db_entity::id::Id;
use db_entity::inventory_item::dto::{
    CreateInventoryItemWithStock, InventoryItemResponse, InventoryItemWithStockResponse,
    UpdateInventoryItem,
};
use db_entity::inventory_item::{self, Entity as InventoryItem};
use db_entity::inventory_stock::dto::{AdjustStock, InventoryStockResponse, UpdateInventoryStock};
use db_entity::inventory_stock::{self, Entity as InventoryStock};
use rust_decimal::Decimal;
use sea_orm::sea_query::Expr;
use sea_orm::*;
use serde::{Deserialize, Serialize};
use tap::{Pipe, Tap, TapFallible};

use crate::error::{ServiceError, ServiceResult};

/// Inventory service for managing medicine catalog and stock
pub struct InventoryService {
    db: Arc<DatabaseConnection>,
}

impl InventoryService {
    /// Create a new inventory service
    pub fn new(db: Arc<DatabaseConnection>) -> Self {
        Self { db }
    }

    // ========================================================================
    // Helper Methods
    // ========================================================================

    /// Convert Decimal price to f64 safely
    fn decimal_to_f64(decimal: &Decimal) -> ServiceResult<f64> {
        decimal
            .to_string()
            .parse::<f64>()
            .map_err(|e| ServiceError::Internal(format!("Failed to convert price: {}", e)))
    }

    /// Build combined response from item and stock models
    fn build_combined_response(
        item: db_entity::inventory_item::Model,
        stock: db_entity::inventory_stock::Model,
    ) -> ServiceResult<InventoryItemWithStockResponse> {
        Ok(InventoryItemWithStockResponse {
            id: item.id,
            name: item.name,
            generic_name: item.generic_name,
            concentration: item.concentration,
            form: item.form,
            manufacturer: item.manufacturer,
            barcode: item.barcode,
            requires_prescription: item.requires_prescription,
            is_controlled: item.is_controlled,
            storage_instructions: item.storage_instructions,
            notes: item.notes,
            is_active: item.is_active,
            created_by: item.created_by,
            updated_by: item.updated_by,
            created_at: item.created_at.to_string(),
            updated_at: item.updated_at.to_string(),
            stock_id: stock.id,
            stock_quantity: stock.stock_quantity,
            min_stock_level: stock.min_stock_level,
            unit_price: Self::decimal_to_f64(&stock.unit_price)?,
            last_restocked_at: stock.last_restocked_at.map(|dt| dt.to_string()),
            stock_updated_at: stock.updated_at.to_string(),
        })
    }

    // ========================================================================
    // CRUD Operations (Catalog + Stock Combined)
    // ========================================================================

    /// Create a new inventory item with stock
    pub async fn create(
        &self,
        dto: CreateInventoryItemWithStock,
        created_by: Option<Id>,
    ) -> ServiceResult<InventoryItemWithStockResponse> {
        let txn = self.db.begin().await?;

        let now = chrono::Utc::now();
        let item_id = Id::new();

        // Create inventory item (catalog)
        let item = inventory_item::ActiveModel {
            id: Set(item_id),
            name: Set(dto.name),
            generic_name: Set(dto.generic_name),
            concentration: Set(dto.concentration),
            form: Set(dto.form),
            manufacturer: Set(dto.manufacturer),
            barcode: Set(dto.barcode),
            requires_prescription: Set(dto.requires_prescription),
            is_controlled: Set(dto.is_controlled),
            storage_instructions: Set(dto.storage_instructions),
            notes: Set(dto.notes),
            is_active: Set(true),
            created_by: Set(created_by),
            updated_by: Set(created_by),
            created_at: Set(now.into()),
            updated_at: Set(now.into()),
            deleted_at: Set(None),
        };

        let item = item
            .insert(&txn)
            .await
            .tap_ok(|_| tracing::info!("Created inventory item: {}", item_id))
            .tap_err(|e| tracing::error!("Failed to create inventory item: {}", e))?;

        // Create inventory stock
        let stock_id = Id::new();
        let unit_price = Decimal::try_from(dto.unit_price)
            .map_err(|e| ServiceError::BadRequest(format!("Invalid unit price: {}", e)))?;

        let stock = inventory_stock::ActiveModel {
            id: Set(stock_id),
            inventory_item_id: Set(item_id),
            stock_quantity: Set(dto.stock_quantity),
            min_stock_level: Set(dto.min_stock_level),
            unit_price: Set(unit_price),
            last_restocked_at: Set(if dto.stock_quantity > 0 {
                Some(now.into())
            } else {
                None
            }),
            created_at: Set(now.into()),
            updated_at: Set(now.into()),
        };

        let stock = stock
            .insert(&txn)
            .await
            .tap_ok(|_| tracing::info!("Created inventory stock: {}", stock_id))
            .tap_err(|e| tracing::error!("Failed to create inventory stock: {}", e))?;

        txn.commit().await?;

        // Build combined response
        Self::build_combined_response(item, stock)
    }

    /// Get inventory item with stock by ID
    pub async fn get_by_id(&self, id: Id) -> ServiceResult<InventoryItemWithStockResponse> {
        let result = InventoryItem::find_by_id(id)
            .find_also_related(InventoryStock)
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Inventory item not found: {}", id)))?;

        let (item, stock) = result;
        let stock = stock.ok_or_else(|| {
            ServiceError::NotFound(format!("Stock record not found for item: {}", id))
        })?;

        tracing::debug!("Retrieved inventory item with stock: {}", id);

        Self::build_combined_response(item, stock)
    }

    /// Get inventory item by barcode
    pub async fn get_by_barcode(
        &self,
        barcode: &str,
    ) -> ServiceResult<InventoryItemWithStockResponse> {
        let result = InventoryItem::find()
            .filter(inventory_item::Column::Barcode.eq(barcode))
            .filter(inventory_item::Column::DeletedAt.is_null())
            .find_also_related(InventoryStock)
            .one(&*self.db)
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!(
                    "Inventory item not found with barcode: {}",
                    barcode
                ))
            })?;

        let (item, stock) = result;
        let stock = stock.ok_or_else(|| {
            ServiceError::NotFound(format!(
                "Stock record not found for item with barcode: {}",
                barcode
            ))
        })?;

        tracing::debug!("Retrieved inventory item by barcode: {}", barcode);

        Self::build_combined_response(item, stock)
    }

    /// Update inventory item (catalog only)
    pub async fn update(
        &self,
        id: Id,
        dto: UpdateInventoryItem,
    ) -> ServiceResult<InventoryItemResponse> {
        let item = InventoryItem::find_by_id(id)
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Inventory item not found: {}", id)))?;

        let mut item: inventory_item::ActiveModel = item.into();

        if let Some(name) = dto.name {
            item.name = Set(name);
        }
        if let Some(generic_name) = dto.generic_name {
            item.generic_name = Set(Some(generic_name));
        }
        if let Some(concentration) = dto.concentration {
            item.concentration = Set(concentration);
        }
        if let Some(form) = dto.form {
            item.form = Set(form);
        }
        if let Some(manufacturer) = dto.manufacturer {
            item.manufacturer = Set(Some(manufacturer));
        }
        if let Some(barcode) = dto.barcode {
            item.barcode = Set(Some(barcode));
        }
        if let Some(requires_prescription) = dto.requires_prescription {
            item.requires_prescription = Set(requires_prescription);
        }
        if let Some(is_controlled) = dto.is_controlled {
            item.is_controlled = Set(is_controlled);
        }
        if let Some(storage_instructions) = dto.storage_instructions {
            item.storage_instructions = Set(Some(storage_instructions));
        }
        if let Some(notes) = dto.notes {
            item.notes = Set(Some(notes));
        }
        if let Some(is_active) = dto.is_active {
            item.is_active = Set(is_active);
        }

        item.updated_by = Set(dto.updated_by);
        item.updated_at = Set(chrono::Utc::now().into());

        let item = item
            .update(&*self.db)
            .await
            .tap_ok(|_| tracing::info!("Updated inventory item: {}", id))
            .tap_err(|e| tracing::error!("Failed to update inventory item {}: {}", id, e))?;

        Ok(InventoryItemResponse::from(item))
    }

    /// Delete inventory item (soft delete - affects both tables via CASCADE)
    pub async fn delete(&self, id: Id) -> ServiceResult<()> {
        let item = InventoryItem::find_by_id(id)
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Inventory item not found: {}", id)))?;

        let mut item: inventory_item::ActiveModel = item.into();
        item.deleted_at = Set(Some(chrono::Utc::now().into()));
        item.is_active = Set(false);

        item.update(&*self.db)
            .await
            .tap_ok(|_| tracing::info!("Soft deleted inventory item: {}", id))
            .tap_err(|e| tracing::error!("Failed to delete inventory item {}: {}", id, e))?;

        Ok(())
    }

    /// Restore soft-deleted inventory item
    pub async fn restore(&self, id: Id) -> ServiceResult<InventoryItemWithStockResponse> {
        let item = InventoryItem::find_by_id(id)
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Inventory item not found: {}", id)))?;

        let mut item: inventory_item::ActiveModel = item.into();
        item.deleted_at = Set(None);
        item.is_active = Set(true);

        item.update(&*self.db)
            .await
            .tap_ok(|_| tracing::info!("Restored inventory item: {}", id))
            .tap_err(|e| tracing::error!("Failed to restore inventory item {}: {}", id, e))?;

        self.get_by_id(id).await
    }

    // ========================================================================
    // Stock Management Operations
    // ========================================================================

    /// Update stock (set absolute values)
    pub async fn update_stock(
        &self,
        inventory_item_id: Id,
        dto: UpdateInventoryStock,
    ) -> ServiceResult<InventoryStockResponse> {
        let stock = InventoryStock::find()
            .filter(inventory_stock::Column::InventoryItemId.eq(inventory_item_id))
            .one(&*self.db)
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!(
                    "Stock record not found for item: {}",
                    inventory_item_id
                ))
            })?;

        let mut stock: inventory_stock::ActiveModel = stock.into();

        if let Some(stock_quantity) = dto.stock_quantity {
            stock.stock_quantity = Set(stock_quantity);
            if stock_quantity > 0 {
                stock.last_restocked_at = Set(Some(chrono::Utc::now().into()));
            }
        }
        if let Some(min_stock_level) = dto.min_stock_level {
            stock.min_stock_level = Set(min_stock_level);
        }
        if let Some(unit_price) = dto.unit_price {
            let price = Decimal::try_from(unit_price)
                .map_err(|e| ServiceError::BadRequest(format!("Invalid unit price: {}", e)))?;
            stock.unit_price = Set(price);
        }

        stock.updated_at = Set(chrono::Utc::now().into());

        let stock = stock
            .update(&*self.db)
            .await
            .tap_ok(|_| tracing::info!("Updated stock for item: {}", inventory_item_id))
            .tap_err(|e| {
                tracing::error!(
                    "Failed to update stock for item {}: {}",
                    inventory_item_id,
                    e
                )
            })?;

        Ok(InventoryStockResponse::from(stock))
    }

    /// Adjust stock (add or subtract)
    pub async fn adjust_stock(
        &self,
        inventory_item_id: Id,
        dto: AdjustStock,
    ) -> ServiceResult<InventoryStockResponse> {
        let stock = InventoryStock::find()
            .filter(inventory_stock::Column::InventoryItemId.eq(inventory_item_id))
            .one(&*self.db)
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!(
                    "Stock record not found for item: {}",
                    inventory_item_id
                ))
            })?;

        let new_quantity = stock.stock_quantity + dto.adjustment;

        if new_quantity < 0 {
            return Err(ServiceError::BadRequest(
                "Stock quantity cannot be negative".to_string(),
            ));
        }

        let mut stock: inventory_stock::ActiveModel = stock.into();
        stock.stock_quantity = Set(new_quantity);

        if dto.adjustment > 0 {
            stock.last_restocked_at = Set(Some(chrono::Utc::now().into()));
        }

        stock.updated_at = Set(chrono::Utc::now().into());

        let stock = stock
            .update(&*self.db)
            .await
            .tap_ok(|_| {
                tracing::info!(
                    "Adjusted stock for item {}: {} (reason: {:?})",
                    inventory_item_id,
                    dto.adjustment,
                    dto.reason
                )
            })
            .tap_err(|e| {
                tracing::error!(
                    "Failed to adjust stock for item {}: {}",
                    inventory_item_id,
                    e
                )
            })?;

        Ok(InventoryStockResponse::from(stock))
    }

    // ========================================================================
    // Listing & Filtering Operations
    // ========================================================================

    /// List all active inventory items with stock
    pub async fn list_active(&self) -> ServiceResult<Vec<InventoryItemWithStockResponse>> {
        let results = InventoryItem::find()
            .filter(inventory_item::Column::IsActive.eq(true))
            .filter(inventory_item::Column::DeletedAt.is_null())
            .find_also_related(InventoryStock)
            .all(&*self.db)
            .await
            .tap_err(|e| tracing::error!("Failed to list active inventory items: {}", e))?;

        results
            .into_iter()
            .filter_map(|(item, stock)| stock.map(|stock| (item, stock)))
            .map(|(item, stock)| Self::build_combined_response(item, stock))
            .collect::<ServiceResult<Vec<_>>>()
            .tap_ok(|items| tracing::debug!("Listed {} active inventory items", items.len()))
    }

    /// Get low stock items (optimized with database-level filtering)
    pub async fn get_low_stock(&self) -> ServiceResult<Vec<InventoryItemWithStockResponse>> {
        // Use inner join with WHERE clause for efficient database-level filtering
        // WHERE stock_quantity <= min_stock_level
        let results = InventoryItem::find()
            .filter(inventory_item::Column::IsActive.eq(true))
            .filter(inventory_item::Column::DeletedAt.is_null())
            .inner_join(InventoryStock)
            .filter(
                Expr::col((
                    inventory_stock::Entity,
                    inventory_stock::Column::StockQuantity,
                ))
                .lte(Expr::col((
                    inventory_stock::Entity,
                    inventory_stock::Column::MinStockLevel,
                ))),
            )
            .find_also_related(InventoryStock)
            .all(&*self.db)
            .await
            .tap_err(|e| tracing::error!("Failed to get low stock items: {}", e))?;

        results
            .into_iter()
            .filter_map(|(item, stock)| stock.map(|stock| (item, stock)))
            .map(|(item, stock)| Self::build_combined_response(item, stock))
            .collect::<ServiceResult<Vec<_>>>()
            .tap_ok(|items| tracing::debug!("Retrieved {} low stock items", items.len()))
    }

    /// Get out of stock items (optimized with database-level filtering)
    pub async fn get_out_of_stock(&self) -> ServiceResult<Vec<InventoryItemWithStockResponse>> {
        let results = InventoryItem::find()
            .filter(inventory_item::Column::IsActive.eq(true))
            .filter(inventory_item::Column::DeletedAt.is_null())
            .inner_join(InventoryStock)
            .filter(inventory_stock::Column::StockQuantity.eq(0))
            .find_also_related(InventoryStock)
            .all(&*self.db)
            .await
            .tap_err(|e| tracing::error!("Failed to get out of stock items: {}", e))?;

        results
            .into_iter()
            .filter_map(|(item, stock)| stock.map(|stock| (item, stock)))
            .map(|(item, stock)| Self::build_combined_response(item, stock))
            .collect::<ServiceResult<Vec<_>>>()
            .tap_ok(|items| tracing::debug!("Retrieved {} out of stock items", items.len()))
    }

    /// Search inventory items by name or generic name
    pub async fn search(
        &self,
        search_term: &str,
    ) -> ServiceResult<Vec<InventoryItemWithStockResponse>> {
        let search_pattern = format!("%{}%", search_term);

        let results = InventoryItem::find()
            .filter(
                Condition::any()
                    .add(inventory_item::Column::Name.like(&search_pattern))
                    .add(inventory_item::Column::GenericName.like(&search_pattern))
                    .add(inventory_item::Column::Barcode.like(&search_pattern)),
            )
            .filter(inventory_item::Column::DeletedAt.is_null())
            .find_also_related(InventoryStock)
            .all(&*self.db)
            .await
            .tap_err(|e| {
                tracing::error!("Failed to search inventory items '{}': {}", search_term, e)
            })?;

        results
            .into_iter()
            .filter_map(|(item, stock)| stock.map(|stock| (item, stock)))
            .map(|(item, stock)| Self::build_combined_response(item, stock))
            .collect::<ServiceResult<Vec<_>>>()
            .tap_ok(|items| tracing::debug!("Search '{}' found {} items", search_term, items.len()))
    }

    // ========================================================================
    // Statistics
    // ========================================================================

    /// Get inventory statistics
    pub async fn get_statistics(&self) -> ServiceResult<InventoryStatistics> {
        let total_items = InventoryItem::find()
            .filter(inventory_item::Column::DeletedAt.is_null())
            .count(&*self.db)
            .await
            .tap_err(|e| tracing::error!("Failed to count total items: {}", e))?;

        let active_items = InventoryItem::find()
            .filter(inventory_item::Column::IsActive.eq(true))
            .filter(inventory_item::Column::DeletedAt.is_null())
            .count(&*self.db)
            .await
            .tap_err(|e| tracing::error!("Failed to count active items: {}", e))?;

        let low_stock_count = self.get_low_stock().await?.len() as u64;
        let out_of_stock_count = self.get_out_of_stock().await?.len() as u64;

        // Calculate total inventory value
        let stocks = InventoryStock::find()
            .all(&*self.db)
            .await
            .tap_err(|e| tracing::error!("Failed to fetch stocks for statistics: {}", e))?;

        let total_value: f64 = stocks
            .iter()
            .map(|s| Self::decimal_to_f64(&s.unit_price).unwrap_or(0.0) * s.stock_quantity as f64)
            .sum();

        InventoryStatistics {
            total_items,
            active_items,
            inactive_items: total_items - active_items,
            low_stock_count,
            out_of_stock_count,
            total_inventory_value: total_value,
        }
        .tap(|stats| {
            tracing::debug!(
                "Retrieved inventory statistics: {} total, {} active, {} low stock",
                stats.total_items,
                stats.active_items,
                stats.low_stock_count
            )
        })
        .pipe(Ok)
    }
}

/// Inventory statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InventoryStatistics {
    pub total_items: u64,
    pub active_items: u64,
    pub inactive_items: u64,
    pub low_stock_count: u64,
    pub out_of_stock_count: u64,
    pub total_inventory_value: f64,
}
