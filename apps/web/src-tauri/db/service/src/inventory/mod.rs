pub mod price_history;
pub mod stock_history;

use std::sync::Arc;

use db_entity::id::Id;
use db_entity::inventory_item::dto::{
    CreateInventoryItemWithStock, InventoryItemResponse, InventoryItemWithStockResponse,
    UpdateInventoryItem,
};
use db_entity::inventory_item::{self, Entity as InventoryItem};
use db_entity::inventory_item_barcode::dto::InventoryItemBarcodeResponse;
use db_entity::inventory_item_barcode::{self, Entity as InventoryItemBarcode};
use db_entity::inventory_stock::dto::{AdjustStock, InventoryStockResponse, UpdateInventoryStock};
use db_entity::inventory_stock::{self, Entity as InventoryStock};
use db_entity::inventory_stock_history::{self};
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
    async fn build_combined_response(
        &self,
        item: db_entity::inventory_item::Model,
        stock: db_entity::inventory_stock::Model,
    ) -> ServiceResult<InventoryItemWithStockResponse> {
        // Fetch barcodes for this item
        let barcodes = self.get_item_barcodes(item.id).await?;

        // Fetch manufacturer name if manufacturer_id exists
        let manufacturer_name = if let Some(manufacturer_id) = item.manufacturer_id {
            db_entity::manufacturer::Entity::find_by_id(manufacturer_id)
                .one(self.db.as_ref())
                .await?
                .map(|m| m.name)
        } else {
            None
        };

        Ok(InventoryItemWithStockResponse {
            id: item.id,
            name: item.name,
            generic_name: item.generic_name,
            concentration: item.concentration,
            form: item.form,
            manufacturer_id: item.manufacturer_id,
            manufacturer_name,
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
            barcodes,
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
            manufacturer_id: Set(dto.manufacturer_id),
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

        // Create barcodes if provided
        for (index, barcode_input) in dto.barcodes.iter().enumerate() {
            let barcode = inventory_item_barcode::ActiveModel {
                id: Set(Id::new()),
                inventory_item_id: Set(item_id),
                barcode: Set(barcode_input.barcode.clone()),
                barcode_type: Set(barcode_input.barcode_type.clone()),
                is_primary: Set(barcode_input.is_primary || (index == 0 && dto.barcodes.len() == 1)),
                description: Set(barcode_input.description.clone()),
                created_at: Set(now.into()),
                created_by: Set(created_by),
            };

            barcode
                .insert(&txn)
                .await
                .tap_ok(|_| tracing::info!("Created barcode for item: {}", item_id))
                .tap_err(|e| tracing::error!("Failed to create barcode: {}", e))?;
        }

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
        self.build_combined_response(item, stock).await
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

        self.build_combined_response(item, stock).await
    }

    /// Get inventory item by barcode
    pub async fn get_by_barcode(
        &self,
        barcode: &str,
    ) -> ServiceResult<InventoryItemWithStockResponse> {
        // Find barcode first
        let barcode_record = InventoryItemBarcode::find()
            .filter(inventory_item_barcode::Column::Barcode.eq(barcode))
            .one(&*self.db)
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!(
                    "Inventory item not found with barcode: {}",
                    barcode
                ))
            })?;

        // Get item with stock
        let result = InventoryItem::find_by_id(barcode_record.inventory_item_id)
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

        self.build_combined_response(item, stock).await
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
        if let Some(manufacturer_id) = dto.manufacturer_id {
            item.manufacturer_id = Set(Some(manufacturer_id));
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

        let old_quantity = stock.stock_quantity;
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

        // Get adjustment type or default to ManualAdjustment
        let adjustment_type = dto
            .adjustment_type
            .unwrap_or(inventory_stock_history::StockAdjustmentType::ManualAdjustment);

        // Create stock history record using type-safe SeaORM
        let history = inventory_stock_history::ActiveModel {
            id: Set(Id::new()),
            inventory_item_id: Set(inventory_item_id),
            adjustment_type: Set(adjustment_type.clone()),
            quantity_before: Set(old_quantity),
            quantity_after: Set(new_quantity),
            adjustment_amount: Set(dto.adjustment),
            reason: Set(dto.reason.clone()),
            reference_id: Set(None),
            reference_type: Set(None),
            recorded_at: Set(chrono::Utc::now().into()),
            recorded_by: Set(None),
        };

        history
            .insert(&*self.db)
            .await
            .tap_ok(|_| {
                tracing::info!(
                    "Created stock history record for item {}: {:?}",
                    inventory_item_id,
                    adjustment_type
                )
            })
            .tap_err(|e| tracing::error!("Failed to create stock history record: {}", e))?;

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

        let mut items = Vec::new();
        for (item, stock) in results {
            if let Some(stock) = stock {
                items.push(self.build_combined_response(item, stock).await?);
            }
        }

        tracing::debug!("Listed {} active inventory items", items.len());
        Ok(items)
    }

    /// Get low stock items (optimized with database-level filtering)
    pub async fn get_low_stock(&self) -> ServiceResult<Vec<InventoryItemWithStockResponse>> {
        // Use find_also_related with filter for efficient database-level filtering
        // WHERE stock_quantity <= min_stock_level
        let results = InventoryItem::find()
            .filter(inventory_item::Column::IsActive.eq(true))
            .filter(inventory_item::Column::DeletedAt.is_null())
            .find_also_related(InventoryStock)
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
            .all(&*self.db)
            .await
            .tap_err(|e| tracing::error!("Failed to get low stock items: {}", e))?;

        let mut items = Vec::new();
        for (item, stock) in results {
            if let Some(stock) = stock {
                items.push(self.build_combined_response(item, stock).await?);
            }
        }

        tracing::debug!("Retrieved {} low stock items", items.len());
        Ok(items)
    }

    /// Get out of stock items (optimized with database-level filtering)
    pub async fn get_out_of_stock(&self) -> ServiceResult<Vec<InventoryItemWithStockResponse>> {
        let results = InventoryItem::find()
            .filter(inventory_item::Column::IsActive.eq(true))
            .filter(inventory_item::Column::DeletedAt.is_null())
            .find_also_related(InventoryStock)
            .filter(inventory_stock::Column::StockQuantity.eq(0))
            .all(&*self.db)
            .await
            .tap_err(|e| tracing::error!("Failed to get out of stock items: {}", e))?;

        let mut items = Vec::new();
        for (item, stock) in results {
            if let Some(stock) = stock {
                items.push(self.build_combined_response(item, stock).await?);
            }
        }

        tracing::debug!("Retrieved {} out of stock items", items.len());
        Ok(items)
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
                    .add(inventory_item::Column::GenericName.like(&search_pattern)),
            )
            .filter(inventory_item::Column::DeletedAt.is_null())
            .find_also_related(InventoryStock)
            .all(&*self.db)
            .await
            .tap_err(|e| {
                tracing::error!("Failed to search inventory items '{}': {}", search_term, e)
            })?;

        let mut items = Vec::new();
        for (item, stock) in results {
            if let Some(stock) = stock {
                items.push(self.build_combined_response(item, stock).await?);
            }
        }

        tracing::debug!("Search '{}' found {} items", search_term, items.len());
        Ok(items)
    }

    // ========================================================================
    // Barcode Management Operations
    // ========================================================================

    /// Get all barcodes for an inventory item
    pub async fn get_item_barcodes(
        &self,
        item_id: Id,
    ) -> ServiceResult<Vec<InventoryItemBarcodeResponse>> {
        let barcodes = InventoryItemBarcode::find()
            .filter(inventory_item_barcode::Column::InventoryItemId.eq(item_id))
            .order_by_desc(inventory_item_barcode::Column::IsPrimary)
            .order_by_asc(inventory_item_barcode::Column::CreatedAt)
            .all(&*self.db)
            .await
            .tap_err(|e| tracing::error!("Failed to get barcodes for item {}: {}", item_id, e))?;

        Ok(barcodes
            .into_iter()
            .map(InventoryItemBarcodeResponse::from)
            .collect())
    }

    /// Add a barcode to an inventory item
    pub async fn add_barcode(
        &self,
        item_id: Id,
        barcode: String,
        barcode_type: Option<String>,
        is_primary: bool,
        description: Option<String>,
        created_by: Option<Id>,
    ) -> ServiceResult<Id> {
        // Verify item exists
        InventoryItem::find_by_id(item_id)
            .one(&*self.db)
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!("Inventory item not found: {}", item_id))
            })?;

        // If setting as primary, unset other primary barcodes
        if is_primary {
            InventoryItemBarcode::update_many()
                .filter(inventory_item_barcode::Column::InventoryItemId.eq(item_id))
                .filter(inventory_item_barcode::Column::IsPrimary.eq(true))
                .col_expr(
                    inventory_item_barcode::Column::IsPrimary,
                    Expr::value(false),
                )
                .exec(&*self.db)
                .await
                .tap_err(|e| tracing::error!("Failed to unset primary barcodes: {}", e))?;
        }

        let barcode_id = Id::new();
        let barcode_model = inventory_item_barcode::ActiveModel {
            id: Set(barcode_id),
            inventory_item_id: Set(item_id),
            barcode: Set(barcode),
            barcode_type: Set(barcode_type),
            is_primary: Set(is_primary),
            description: Set(description),
            created_at: Set(chrono::Utc::now().into()),
            created_by: Set(created_by),
        };

        barcode_model
            .insert(&*self.db)
            .await
            .tap_ok(|_| tracing::info!("Added barcode {} to item {}", barcode_id, item_id))
            .tap_err(|e| tracing::error!("Failed to add barcode: {}", e))?;

        Ok(barcode_id)
    }

    /// Remove a barcode
    pub async fn remove_barcode(&self, barcode_id: Id) -> ServiceResult<()> {
        let barcode = InventoryItemBarcode::find_by_id(barcode_id)
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Barcode not found: {}", barcode_id)))?;

        // Check if this is the only barcode for the item
        let barcode_count = InventoryItemBarcode::find()
            .filter(inventory_item_barcode::Column::InventoryItemId.eq(barcode.inventory_item_id))
            .count(&*self.db)
            .await?;

        if barcode_count <= 1 {
            return Err(ServiceError::BadRequest(
                "Cannot remove the last barcode from an item".to_string(),
            ));
        }

        InventoryItemBarcode::delete_by_id(barcode_id)
            .exec(&*self.db)
            .await
            .tap_ok(|_| tracing::info!("Removed barcode: {}", barcode_id))
            .tap_err(|e| tracing::error!("Failed to remove barcode {}: {}", barcode_id, e))?;

        Ok(())
    }

    /// Set a barcode as primary
    pub async fn set_primary_barcode(&self, item_id: Id, barcode_id: Id) -> ServiceResult<()> {
        // Verify barcode exists and belongs to item
        let barcode = InventoryItemBarcode::find_by_id(barcode_id)
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Barcode not found: {}", barcode_id)))?;

        if barcode.inventory_item_id != item_id {
            return Err(ServiceError::BadRequest(
                "Barcode does not belong to this item".to_string(),
            ));
        }

        let txn = self.db.begin().await?;

        // Unset all primary barcodes for this item
        InventoryItemBarcode::update_many()
            .filter(inventory_item_barcode::Column::InventoryItemId.eq(item_id))
            .col_expr(
                inventory_item_barcode::Column::IsPrimary,
                Expr::value(false),
            )
            .exec(&txn)
            .await?;

        // Set this barcode as primary
        let mut barcode: inventory_item_barcode::ActiveModel = barcode.into();
        barcode.is_primary = Set(true);
        barcode.update(&txn).await?;

        txn.commit().await?;

        tracing::info!("Set barcode {} as primary for item {}", barcode_id, item_id);
        Ok(())
    }

    /// Update a barcode
    pub async fn update_barcode(
        &self,
        barcode_id: Id,
        barcode: Option<String>,
        barcode_type: Option<String>,
        description: Option<String>,
    ) -> ServiceResult<()> {
        let existing = InventoryItemBarcode::find_by_id(barcode_id)
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Barcode not found: {}", barcode_id)))?;

        let mut barcode_model: inventory_item_barcode::ActiveModel = existing.into();

        if let Some(barcode) = barcode {
            barcode_model.barcode = Set(barcode);
        }
        if let Some(barcode_type) = barcode_type {
            barcode_model.barcode_type = Set(Some(barcode_type));
        }
        if let Some(description) = description {
            barcode_model.description = Set(Some(description));
        }

        barcode_model
            .update(&*self.db)
            .await
            .tap_ok(|_| tracing::info!("Updated barcode: {}", barcode_id))
            .tap_err(|e| tracing::error!("Failed to update barcode {}: {}", barcode_id, e))?;

        Ok(())
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
