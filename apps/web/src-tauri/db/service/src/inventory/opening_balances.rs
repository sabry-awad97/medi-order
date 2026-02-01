use std::sync::Arc;

use db_entity::id::Id;
use db_entity::inventory_opening_balance::dto::{
    CreateAdjustmentDto, CreateOpeningBalanceDto, OpeningBalanceQueryDto, OpeningBalanceResponse,
    OpeningBalanceStatistics, UpdateOpeningBalanceDto,
};
use db_entity::inventory_opening_balance::{
    self, Entity as OpeningBalance, OpeningBalanceEntryType,
};
use db_entity::inventory_stock_history::{self, StockAdjustmentType};
use rust_decimal::Decimal;
use sea_orm::*;
use tap::TapFallible;

use crate::error::{ServiceError, ServiceResult};
use crate::pagination::{PaginationParams, PaginationResult};

/// Opening balance service for managing initial stock quantities
pub struct OpeningBalanceService {
    db: Arc<DatabaseConnection>,
}

impl OpeningBalanceService {
    /// Create a new opening balance service
    pub fn new(db: Arc<DatabaseConnection>) -> Self {
        Self { db }
    }

    // ========================================================================
    // Helper Methods
    // ========================================================================

    /// Convert Decimal to f64 safely
    fn decimal_to_f64(decimal: &Decimal) -> ServiceResult<f64> {
        decimal
            .to_string()
            .parse::<f64>()
            .map_err(|e| ServiceError::Internal(format!("Failed to convert price: {}", e)))
    }

    /// Validate that inventory item exists and is active
    async fn validate_inventory_item(
        &self,
        txn: &DatabaseTransaction,
        item_id: Id,
    ) -> ServiceResult<()> {
        let item = db_entity::inventory_item::Entity::find_by_id(item_id)
            .one(txn)
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!("Inventory item not found: {}", item_id))
            })?;

        if !item.is_active {
            return Err(ServiceError::BadRequest(
                "Cannot create opening balance for inactive item".to_string(),
            ));
        }

        if item.deleted_at.is_some() {
            return Err(ServiceError::BadRequest(
                "Cannot create opening balance for deleted item".to_string(),
            ));
        }

        Ok(())
    }

    /// Check if opening balance already exists for item
    async fn check_existing_balance(
        &self,
        txn: &DatabaseTransaction,
        item_id: Id,
    ) -> ServiceResult<()> {
        let existing = OpeningBalance::find()
            .filter(inventory_opening_balance::Column::InventoryItemId.eq(item_id))
            .filter(inventory_opening_balance::Column::IsActive.eq(true))
            .filter(
                inventory_opening_balance::Column::EntryType.eq(OpeningBalanceEntryType::Initial),
            )
            .one(txn)
            .await?;

        if existing.is_some() {
            return Err(ServiceError::Conflict(
                "Opening balance already exists for this item. Use adjustment instead.".to_string(),
            ));
        }

        Ok(())
    }

    /// Update inventory stock from opening balance
    async fn update_stock_from_opening_balance(
        &self,
        txn: &DatabaseTransaction,
        balance: &db_entity::inventory_opening_balance::Model,
    ) -> ServiceResult<()> {
        // Get current stock
        let stock = db_entity::inventory_stock::Entity::find()
            .filter(
                db_entity::inventory_stock::Column::InventoryItemId.eq(balance.inventory_item_id),
            )
            .one(txn)
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!(
                    "Stock record not found for item: {}",
                    balance.inventory_item_id
                ))
            })?;

        // Update stock
        let mut stock: db_entity::inventory_stock::ActiveModel = stock.into();
        stock.stock_quantity = Set(balance.quantity);
        stock.unit_price = Set(balance.unit_price);
        stock.last_restocked_at = Set(Some(chrono::Utc::now().into()));
        stock.updated_at = Set(chrono::Utc::now().into());

        stock
            .update(txn)
            .await
            .tap_ok(|_| {
                tracing::info!(
                    "Updated stock from opening balance for item: {}",
                    balance.inventory_item_id
                )
            })
            .tap_err(|e| tracing::error!("Failed to update stock: {}", e))?;

        Ok(())
    }

    /// Create stock history entry for opening balance
    async fn create_stock_history_entry(
        &self,
        txn: &DatabaseTransaction,
        balance: &db_entity::inventory_opening_balance::Model,
        quantity_before: i32,
    ) -> ServiceResult<()> {
        let history = inventory_stock_history::ActiveModel {
            id: Set(Id::new()),
            inventory_item_id: Set(balance.inventory_item_id),
            adjustment_type: Set(StockAdjustmentType::OpeningBalance),
            quantity_before: Set(quantity_before),
            quantity_after: Set(balance.quantity),
            adjustment_amount: Set(balance.quantity - quantity_before),
            reason: Set(balance.reason.clone()),
            reference_id: Set(Some(balance.id)),
            reference_type: Set(Some("opening_balance".to_string())),
            recorded_at: Set(chrono::Utc::now().into()),
            recorded_by: Set(Some(balance.entered_by)),
        };

        history
            .insert(txn)
            .await
            .tap_ok(|_| {
                tracing::info!(
                    "Created stock history entry for opening balance: {}",
                    balance.id
                )
            })
            .tap_err(|e| tracing::error!("Failed to create stock history: {}", e))?;

        Ok(())
    }

    /// Build response with related data
    async fn build_response(
        &self,
        model: db_entity::inventory_opening_balance::Model,
    ) -> ServiceResult<OpeningBalanceResponse> {
        // Get inventory item name
        let item = db_entity::inventory_item::Entity::find_by_id(model.inventory_item_id)
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!(
                    "Inventory item not found: {}",
                    model.inventory_item_id
                ))
            })?;

        // Get entered by user name
        let entered_by_user = db_entity::user::Entity::find_by_id(model.entered_by)
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!("User not found: {}", model.entered_by))
            })?;

        // Get verified by user name if exists
        let verified_by_name = if let Some(verified_by) = model.verified_by {
            db_entity::user::Entity::find_by_id(verified_by)
                .one(self.db.as_ref())
                .await?
                .map(|u| format!("{} {}", u.first_name, u.last_name))
        } else {
            None
        };

        Ok(OpeningBalanceResponse {
            id: model.id,
            inventory_item_id: model.inventory_item_id,
            inventory_item_name: item.name,
            quantity: model.quantity,
            unit_price: Self::decimal_to_f64(&model.unit_price)?,
            total_value: (model.quantity as f64) * Self::decimal_to_f64(&model.unit_price)?,
            batch_number: model.batch_number,
            expiry_date: model.expiry_date,
            entry_date: model.entry_date,
            entry_type: model.entry_type,
            reason: model.reason,
            notes: model.notes,
            entered_by: model.entered_by,
            entered_by_name: format!(
                "{} {}",
                entered_by_user.first_name, entered_by_user.last_name
            ),
            is_verified: model.is_verified,
            verified_by: model.verified_by,
            verified_by_name,
            verified_at: model.verified_at.map(|dt| dt.to_string()),
            import_batch_id: model.import_batch_id,
            import_file_name: model.import_file_name,
            is_active: model.is_active,
            created_at: model.created_at.to_string(),
            updated_at: model.updated_at.to_string(),
        })
    }

    // ========================================================================
    // CRUD Operations
    // ========================================================================

    /// Create a new opening balance entry
    pub async fn create(
        &self,
        dto: CreateOpeningBalanceDto,
        entered_by: Id,
    ) -> ServiceResult<OpeningBalanceResponse> {
        let txn = self.db.begin().await?;

        // Validate inventory item
        self.validate_inventory_item(&txn, dto.inventory_item_id)
            .await?;

        // Check for existing balance if override not allowed
        if !dto.allow_override {
            self.check_existing_balance(&txn, dto.inventory_item_id)
                .await?;
        }

        // Get current stock quantity for history
        let current_stock = db_entity::inventory_stock::Entity::find()
            .filter(db_entity::inventory_stock::Column::InventoryItemId.eq(dto.inventory_item_id))
            .one(&txn)
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!(
                    "Stock record not found for item: {}",
                    dto.inventory_item_id
                ))
            })?;
        let quantity_before = current_stock.stock_quantity;

        // Create opening balance record
        let balance = inventory_opening_balance::ActiveModel {
            id: Set(Id::new()),
            inventory_item_id: Set(dto.inventory_item_id),
            entered_by: Set(entered_by),
            adjusted_from_id: Set(None),
            quantity: Set(dto.quantity),
            unit_price: Set(dto.unit_price),
            batch_number: Set(dto.batch_number),
            expiry_date: Set(dto.expiry_date),
            entry_date: Set(dto.entry_date),
            entry_type: Set(dto.entry_type),
            reason: Set(dto.reason),
            notes: Set(dto.notes),
            import_batch_id: Set(None),
            import_file_name: Set(None),
            is_active: Set(true),
            is_verified: Set(false),
            verified_by: Set(None),
            verified_at: Set(None),
            created_at: Set(chrono::Utc::now().into()),
            updated_at: Set(chrono::Utc::now().into()),
        };

        let balance = balance
            .insert(&txn)
            .await
            .tap_ok(|b| {
                tracing::info!(
                    "Created opening balance for item {}: {} units",
                    dto.inventory_item_id,
                    b.quantity
                )
            })
            .tap_err(|e| tracing::error!("Failed to create opening balance: {}", e))?;

        // Update stock
        self.update_stock_from_opening_balance(&txn, &balance)
            .await?;

        // Create stock history entry
        self.create_stock_history_entry(&txn, &balance, quantity_before)
            .await?;

        txn.commit().await?;

        self.build_response(balance).await
    }

    /// Get opening balance by ID
    pub async fn get_by_id(&self, id: Id) -> ServiceResult<OpeningBalanceResponse> {
        let balance = OpeningBalance::find_by_id(id)
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Opening balance not found: {}", id)))?;

        self.build_response(balance).await
    }

    /// List opening balances with filtering and pagination
    pub async fn list(
        &self,
        query: OpeningBalanceQueryDto,
        pagination: Option<PaginationParams>,
    ) -> ServiceResult<PaginationResult<OpeningBalanceResponse>> {
        let mut select = OpeningBalance::find();

        // Apply filters
        if let Some(inventory_item_id) = query.inventory_item_id {
            select = select
                .filter(inventory_opening_balance::Column::InventoryItemId.eq(inventory_item_id));
        }
        if let Some(entry_date_from) = query.entry_date_from {
            select =
                select.filter(inventory_opening_balance::Column::EntryDate.gte(entry_date_from));
        }
        if let Some(entry_date_to) = query.entry_date_to {
            select = select.filter(inventory_opening_balance::Column::EntryDate.lte(entry_date_to));
        }
        if let Some(entered_by) = query.entered_by {
            select = select.filter(inventory_opening_balance::Column::EnteredBy.eq(entered_by));
        }
        if let Some(entry_type) = query.entry_type {
            select = select.filter(inventory_opening_balance::Column::EntryType.eq(entry_type));
        }
        if let Some(is_verified) = query.is_verified {
            select = select.filter(inventory_opening_balance::Column::IsVerified.eq(is_verified));
        }
        if let Some(is_active) = query.is_active {
            select = select.filter(inventory_opening_balance::Column::IsActive.eq(is_active));
        }
        if let Some(import_batch_id) = query.import_batch_id {
            select =
                select.filter(inventory_opening_balance::Column::ImportBatchId.eq(import_batch_id));
        }
        if let Some(batch_number) = query.batch_number {
            select = select.filter(inventory_opening_balance::Column::BatchNumber.eq(batch_number));
        }

        // Get total count
        let total = select.clone().count(self.db.as_ref()).await?;

        // Handle pagination
        let (response_items, page, page_size) = if let Some(pagination) = pagination {
            let page = pagination.page();
            let page_size = pagination.page_size();

            let paginator = select
                .order_by_desc(inventory_opening_balance::Column::EntryDate)
                .order_by_desc(inventory_opening_balance::Column::CreatedAt)
                .paginate(self.db.as_ref(), page_size);
            let items = paginator.fetch_page(page - 1).await?;

            let mut response_items = Vec::new();
            for item in items {
                response_items.push(self.build_response(item).await?);
            }
            (response_items, page, page_size)
        } else {
            let items = select
                .order_by_desc(inventory_opening_balance::Column::EntryDate)
                .order_by_desc(inventory_opening_balance::Column::CreatedAt)
                .all(self.db.as_ref())
                .await?;

            let mut response_items = Vec::new();
            for item in items {
                response_items.push(self.build_response(item).await?);
            }
            (response_items, 1u64, total)
        };

        Ok(PaginationResult::new(
            response_items,
            total,
            page,
            page_size,
        ))
    }

    /// Update opening balance (limited fields)
    pub async fn update(
        &self,
        id: Id,
        dto: UpdateOpeningBalanceDto,
    ) -> ServiceResult<OpeningBalanceResponse> {
        let balance = OpeningBalance::find_by_id(id)
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Opening balance not found: {}", id)))?;

        let mut balance: inventory_opening_balance::ActiveModel = balance.into();

        if let Some(is_verified) = dto.is_verified {
            balance.is_verified = Set(is_verified);
        }
        if let Some(notes) = dto.notes {
            balance.notes = Set(Some(notes));
        }

        balance.updated_at = Set(chrono::Utc::now().into());

        let balance = balance
            .update(self.db.as_ref())
            .await
            .tap_ok(|_| tracing::info!("Updated opening balance: {}", id))
            .tap_err(|e| tracing::error!("Failed to update opening balance {}: {}", id, e))?;

        self.build_response(balance).await
    }

    // ========================================================================
    // Verification Operations
    // ========================================================================

    /// Verify an opening balance entry
    pub async fn verify(&self, id: Id, verified_by: Id) -> ServiceResult<OpeningBalanceResponse> {
        let balance = OpeningBalance::find_by_id(id)
            .one(self.db.as_ref())
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Opening balance not found: {}", id)))?;

        if balance.is_verified {
            return Err(ServiceError::BadRequest(
                "Opening balance is already verified".to_string(),
            ));
        }

        let mut balance: inventory_opening_balance::ActiveModel = balance.into();
        balance.is_verified = Set(true);
        balance.verified_by = Set(Some(verified_by));
        balance.verified_at = Set(Some(chrono::Utc::now().into()));
        balance.updated_at = Set(chrono::Utc::now().into());

        let balance = balance
            .update(self.db.as_ref())
            .await
            .tap_ok(|_| tracing::info!("Verified opening balance: {}", id))
            .tap_err(|e| tracing::error!("Failed to verify opening balance {}: {}", id, e))?;

        self.build_response(balance).await
    }

    /// Reject an opening balance entry (soft delete)
    pub async fn reject(&self, id: Id, reason: String) -> ServiceResult<()> {
        let txn = self.db.begin().await?;

        let balance = OpeningBalance::find_by_id(id)
            .one(&txn)
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Opening balance not found: {}", id)))?;

        // Reverse stock changes
        let current_stock = db_entity::inventory_stock::Entity::find()
            .filter(
                db_entity::inventory_stock::Column::InventoryItemId.eq(balance.inventory_item_id),
            )
            .one(&txn)
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!(
                    "Stock record not found for item: {}",
                    balance.inventory_item_id
                ))
            })?;

        let mut stock: db_entity::inventory_stock::ActiveModel = current_stock.into();
        stock.stock_quantity = Set(0); // Reset to zero
        stock.updated_at = Set(chrono::Utc::now().into());
        stock.update(&txn).await?;

        // Mark balance as inactive
        let mut balance: inventory_opening_balance::ActiveModel = balance.into();
        balance.is_active = Set(false);
        balance.notes = Set(Some(format!("Rejected: {}", reason)));
        balance.updated_at = Set(chrono::Utc::now().into());
        balance.update(&txn).await?;

        txn.commit().await?;

        tracing::info!("Rejected opening balance: {}", id);
        Ok(())
    }

    // ========================================================================
    // Adjustment Operations
    // ========================================================================

    /// Create an adjustment to an existing opening balance
    pub async fn create_adjustment(
        &self,
        dto: CreateAdjustmentDto,
        entered_by: Id,
    ) -> ServiceResult<OpeningBalanceResponse> {
        let txn = self.db.begin().await?;

        // Verify original balance exists
        let original = OpeningBalance::find_by_id(dto.original_balance_id)
            .one(&txn)
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!(
                    "Original opening balance not found: {}",
                    dto.original_balance_id
                ))
            })?;

        // Get current stock quantity for history
        let current_stock = db_entity::inventory_stock::Entity::find()
            .filter(
                db_entity::inventory_stock::Column::InventoryItemId.eq(original.inventory_item_id),
            )
            .one(&txn)
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!(
                    "Stock record not found for item: {}",
                    original.inventory_item_id
                ))
            })?;
        let quantity_before = current_stock.stock_quantity;

        // Create adjustment entry
        let adjustment = inventory_opening_balance::ActiveModel {
            id: Set(Id::new()),
            inventory_item_id: Set(original.inventory_item_id),
            entered_by: Set(entered_by),
            adjusted_from_id: Set(Some(dto.original_balance_id)),
            quantity: Set(dto.quantity),
            unit_price: Set(dto.unit_price),
            batch_number: Set(original.batch_number.clone()),
            expiry_date: Set(original.expiry_date),
            entry_date: Set(chrono::Utc::now().date_naive()),
            entry_type: Set(OpeningBalanceEntryType::Adjustment),
            reason: Set(Some(dto.reason)),
            notes: Set(dto.notes),
            import_batch_id: Set(None),
            import_file_name: Set(None),
            is_active: Set(true),
            is_verified: Set(false),
            verified_by: Set(None),
            verified_at: Set(None),
            created_at: Set(chrono::Utc::now().into()),
            updated_at: Set(chrono::Utc::now().into()),
        };

        let adjustment = adjustment
            .insert(&txn)
            .await
            .tap_ok(|a| {
                tracing::info!(
                    "Created adjustment for opening balance {}: {} units",
                    dto.original_balance_id,
                    a.quantity
                )
            })
            .tap_err(|e| tracing::error!("Failed to create adjustment: {}", e))?;

        // Update stock
        self.update_stock_from_opening_balance(&txn, &adjustment)
            .await?;

        // Create stock history entry
        self.create_stock_history_entry(&txn, &adjustment, quantity_before)
            .await?;

        txn.commit().await?;

        self.build_response(adjustment).await
    }

    // ========================================================================
    // Query Operations
    // ========================================================================

    /// Get all opening balances for an inventory item
    pub async fn get_by_item(
        &self,
        inventory_item_id: Id,
    ) -> ServiceResult<Vec<OpeningBalanceResponse>> {
        let balances = OpeningBalance::find()
            .filter(inventory_opening_balance::Column::InventoryItemId.eq(inventory_item_id))
            .filter(inventory_opening_balance::Column::IsActive.eq(true))
            .order_by_desc(inventory_opening_balance::Column::EntryDate)
            .all(self.db.as_ref())
            .await
            .tap_err(|e| {
                tracing::error!(
                    "Failed to get opening balances for item {}: {}",
                    inventory_item_id,
                    e
                )
            })?;

        let mut responses = Vec::new();
        for balance in balances {
            responses.push(self.build_response(balance).await?);
        }

        Ok(responses)
    }

    /// Get unverified opening balances
    pub async fn get_unverified(&self) -> ServiceResult<Vec<OpeningBalanceResponse>> {
        let balances = OpeningBalance::find()
            .filter(inventory_opening_balance::Column::IsVerified.eq(false))
            .filter(inventory_opening_balance::Column::IsActive.eq(true))
            .order_by_asc(inventory_opening_balance::Column::EntryDate)
            .all(self.db.as_ref())
            .await
            .tap_err(|e| tracing::error!("Failed to get unverified opening balances: {}", e))?;

        let mut responses = Vec::new();
        for balance in balances {
            responses.push(self.build_response(balance).await?);
        }

        Ok(responses)
    }

    /// Get opening balances by import batch
    pub async fn get_by_import_batch(
        &self,
        import_batch_id: Id,
    ) -> ServiceResult<Vec<OpeningBalanceResponse>> {
        let balances = OpeningBalance::find()
            .filter(inventory_opening_balance::Column::ImportBatchId.eq(import_batch_id))
            .order_by_asc(inventory_opening_balance::Column::CreatedAt)
            .all(self.db.as_ref())
            .await
            .tap_err(|e| {
                tracing::error!(
                    "Failed to get opening balances for import batch {}: {}",
                    import_batch_id,
                    e
                )
            })?;

        let mut responses = Vec::new();
        for balance in balances {
            responses.push(self.build_response(balance).await?);
        }

        Ok(responses)
    }

    // ========================================================================
    // Statistics
    // ========================================================================

    /// Get opening balance statistics
    pub async fn get_statistics(&self) -> ServiceResult<OpeningBalanceStatistics> {
        let all_balances = OpeningBalance::find()
            .filter(inventory_opening_balance::Column::IsActive.eq(true))
            .all(self.db.as_ref())
            .await
            .tap_err(|e| tracing::error!("Failed to get opening balance statistics: {}", e))?;

        let total_entries = all_balances.len() as u64;
        let verified_entries = all_balances.iter().filter(|b| b.is_verified).count() as u64;
        let pending_verification = total_entries - verified_entries;

        let total_value: f64 = all_balances
            .iter()
            .map(|b| (b.quantity as f64) * Self::decimal_to_f64(&b.unit_price).unwrap_or(0.0))
            .sum();

        let items_with_opening_balance = OpeningBalance::find()
            .filter(inventory_opening_balance::Column::IsActive.eq(true))
            .select_only()
            .column(inventory_opening_balance::Column::InventoryItemId)
            .distinct()
            .all(self.db.as_ref())
            .await?
            .len() as u64;

        let latest_entry_date = all_balances.iter().map(|b| b.entry_date).max();

        // Count by type
        let initial = all_balances
            .iter()
            .filter(|b| b.entry_type == OpeningBalanceEntryType::Initial)
            .count() as u64;
        let adjustment = all_balances
            .iter()
            .filter(|b| b.entry_type == OpeningBalanceEntryType::Adjustment)
            .count() as u64;
        let correction = all_balances
            .iter()
            .filter(|b| b.entry_type == OpeningBalanceEntryType::Correction)
            .count() as u64;
        let reconciliation = all_balances
            .iter()
            .filter(|b| b.entry_type == OpeningBalanceEntryType::Reconciliation)
            .count() as u64;

        Ok(OpeningBalanceStatistics {
            total_entries,
            total_value,
            verified_entries,
            pending_verification,
            items_with_opening_balance,
            latest_entry_date,
            entries_by_type: db_entity::inventory_opening_balance::dto::EntriesByType {
                initial,
                adjustment,
                correction,
                reconciliation,
            },
        })
    }
}
