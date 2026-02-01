use super::Id;
use super::Model;
use super::OpeningBalanceEntryType;
use chrono::NaiveDate;
use sea_orm::prelude::Decimal;
use serde::{Deserialize, Serialize};

// ============================================================================
// Input DTOs
// ============================================================================

/// DTO for creating a new opening balance entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateOpeningBalanceDto {
    pub inventory_item_id: Id,
    pub quantity: i32,
    pub unit_price: Decimal,
    pub batch_number: Option<String>,
    pub expiry_date: Option<NaiveDate>,
    pub entry_date: NaiveDate,
    pub entry_type: OpeningBalanceEntryType,
    pub reason: Option<String>,
    pub notes: Option<String>,
    #[serde(default)]
    pub allow_override: bool,
}

/// DTO for updating an existing opening balance entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateOpeningBalanceDto {
    pub is_verified: Option<bool>,
    pub notes: Option<String>,
}

/// DTO for creating an adjustment to an existing opening balance
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAdjustmentDto {
    pub original_balance_id: Id,
    pub quantity: i32,
    pub unit_price: Decimal,
    pub reason: String,
    pub notes: Option<String>,
}

/// DTO for bulk import row
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpeningBalanceImportRow {
    pub item_code: String,
    pub quantity: i32,
    pub unit_price: Decimal,
    pub batch_number: Option<String>,
    pub expiry_date: Option<NaiveDate>,
    pub notes: Option<String>,
}

impl OpeningBalanceImportRow {
    pub fn into_dto(
        self,
        inventory_item_id: Id,
        import_batch_id: Id,
        import_file_name: String,
        entry_date: NaiveDate,
    ) -> CreateOpeningBalanceWithImportDto {
        CreateOpeningBalanceWithImportDto {
            inventory_item_id,
            quantity: self.quantity,
            unit_price: self.unit_price,
            batch_number: self.batch_number,
            expiry_date: self.expiry_date,
            entry_date,
            entry_type: OpeningBalanceEntryType::Initial,
            reason: Some("Bulk import".to_string()),
            notes: self.notes,
            import_batch_id: Some(import_batch_id),
            import_file_name: Some(import_file_name),
        }
    }
}

/// DTO for creating opening balance with import metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateOpeningBalanceWithImportDto {
    pub inventory_item_id: Id,
    pub quantity: i32,
    pub unit_price: Decimal,
    pub batch_number: Option<String>,
    pub expiry_date: Option<NaiveDate>,
    pub entry_date: NaiveDate,
    pub entry_type: OpeningBalanceEntryType,
    pub reason: Option<String>,
    pub notes: Option<String>,
    pub import_batch_id: Option<Id>,
    pub import_file_name: Option<String>,
}

// ============================================================================
// Query DTOs
// ============================================================================

/// Query filter for opening balances
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct OpeningBalanceQueryDto {
    pub inventory_item_id: Option<Id>,
    pub entry_date_from: Option<NaiveDate>,
    pub entry_date_to: Option<NaiveDate>,
    pub entered_by: Option<Id>,
    pub entry_type: Option<OpeningBalanceEntryType>,
    pub is_verified: Option<bool>,
    pub is_active: Option<bool>,
    pub import_batch_id: Option<Id>,
    pub batch_number: Option<String>,
}

// ============================================================================
// Response DTOs
// ============================================================================

/// Response DTO for opening balance entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpeningBalanceResponse {
    pub id: Id,
    pub inventory_item_id: Id,
    pub inventory_item_name: String,
    pub quantity: i32,
    pub unit_price: f64,
    pub total_value: f64,
    pub batch_number: Option<String>,
    pub expiry_date: Option<NaiveDate>,
    pub entry_date: NaiveDate,
    pub entry_type: OpeningBalanceEntryType,
    pub reason: Option<String>,
    pub notes: Option<String>,
    pub entered_by: Id,
    pub entered_by_name: String,
    pub is_verified: bool,
    pub verified_by: Option<Id>,
    pub verified_by_name: Option<String>,
    pub verified_at: Option<String>, // ISO 8601 timestamp
    pub import_batch_id: Option<Id>,
    pub import_file_name: Option<String>,
    pub is_active: bool,
    pub created_at: String, // ISO 8601 timestamp
    pub updated_at: String, // ISO 8601 timestamp
}

impl From<Model> for OpeningBalanceResponse {
    fn from(model: Model) -> Self {
        Self {
            id: model.id,
            inventory_item_id: model.inventory_item_id,
            inventory_item_name: String::new(), // Will be populated by service layer
            quantity: model.quantity,
            unit_price: model.unit_price.to_string().parse().unwrap_or(0.0),
            total_value: (model.quantity as f64)
                * model.unit_price.to_string().parse::<f64>().unwrap_or(0.0),
            batch_number: model.batch_number,
            expiry_date: model.expiry_date,
            entry_date: model.entry_date,
            entry_type: model.entry_type,
            reason: model.reason,
            notes: model.notes,
            entered_by: model.entered_by,
            entered_by_name: String::new(), // Will be populated by service layer
            is_verified: model.is_verified,
            verified_by: model.verified_by,
            verified_by_name: None, // Will be populated by service layer
            verified_at: model.verified_at.map(|dt| dt.to_string()),
            import_batch_id: model.import_batch_id,
            import_file_name: model.import_file_name,
            is_active: model.is_active,
            created_at: model.created_at.to_string(),
            updated_at: model.updated_at.to_string(),
        }
    }
}

// ============================================================================
// Statistics DTOs
// ============================================================================

/// Opening balance statistics DTO
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpeningBalanceStatistics {
    pub total_entries: u64,
    pub total_value: f64,
    pub verified_entries: u64,
    pub pending_verification: u64,
    pub items_with_opening_balance: u64,
    pub latest_entry_date: Option<NaiveDate>,
    pub entries_by_type: EntriesByType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntriesByType {
    pub initial: u64,
    pub adjustment: u64,
    pub correction: u64,
    pub reconciliation: u64,
}

// ============================================================================
// Import Result DTOs
// ============================================================================

/// Result of bulk import operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportResult {
    pub success: bool,
    pub total_rows: usize,
    pub success_count: usize,
    pub error_count: usize,
    pub import_batch_id: Option<Id>,
    pub errors: Vec<ImportRowError>,
}

/// Error for a single import row
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportRowError {
    pub row_number: usize,
    pub item_code: String,
    pub error_message: String,
}

/// Validation result for import
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportValidationResult {
    pub valid_rows: Vec<OpeningBalanceImportRow>,
    pub invalid_rows: Vec<ImportRowError>,
}

impl ImportValidationResult {
    pub fn has_errors(&self) -> bool {
        !self.invalid_rows.is_empty()
    }
}
