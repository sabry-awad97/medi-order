use super::Id;
use super::Model;
use serde::{Deserialize, Serialize};

/// DTO for creating a new inventory item (catalog only)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateInventoryItem {
    pub name: String,
    pub generic_name: Option<String>,
    pub concentration: String,
    pub form: String,
    pub manufacturer: Option<String>,
    pub barcode: Option<String>,
    pub requires_prescription: bool,
    pub is_controlled: bool,
    pub storage_instructions: Option<String>,
    pub notes: Option<String>,
}

/// DTO for creating inventory item with stock (combines both tables)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateInventoryItemWithStock {
    // Catalog fields
    pub name: String,
    pub generic_name: Option<String>,
    pub concentration: String,
    pub form: String,
    pub manufacturer: Option<String>,
    pub barcode: Option<String>,
    pub requires_prescription: bool,
    pub is_controlled: bool,
    pub storage_instructions: Option<String>,
    pub notes: Option<String>,
    // Stock fields
    pub stock_quantity: i32,
    pub min_stock_level: i32,
    pub unit_price: f64,
}

/// DTO for updating an existing inventory item (catalog only)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateInventoryItem {
    pub name: Option<String>,
    pub generic_name: Option<String>,
    pub concentration: Option<String>,
    pub form: Option<String>,
    pub manufacturer: Option<String>,
    pub barcode: Option<String>,
    pub requires_prescription: Option<bool>,
    pub is_controlled: Option<bool>,
    pub storage_instructions: Option<String>,
    pub notes: Option<String>,
    pub is_active: Option<bool>,
    pub updated_by: Option<Id>,
}

/// DTO for inventory item response (catalog only)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InventoryItemResponse {
    pub id: Id,
    pub name: String,
    pub generic_name: Option<String>,
    pub concentration: String,
    pub form: String,
    pub manufacturer: Option<String>,
    pub barcode: Option<String>,
    pub requires_prescription: bool,
    pub is_controlled: bool,
    pub storage_instructions: Option<String>,
    pub notes: Option<String>,
    pub is_active: bool,
    pub created_by: Option<Id>,
    pub updated_by: Option<Id>,
    pub created_at: String,
    pub updated_at: String,
}

/// DTO for inventory item with stock response (combines both tables)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InventoryItemWithStockResponse {
    // Catalog fields
    pub id: Id,
    pub name: String,
    pub generic_name: Option<String>,
    pub concentration: String,
    pub form: String,
    pub manufacturer: Option<String>,
    pub barcode: Option<String>,
    pub requires_prescription: bool,
    pub is_controlled: bool,
    pub storage_instructions: Option<String>,
    pub notes: Option<String>,
    pub is_active: bool,
    pub created_by: Option<Id>,
    pub updated_by: Option<Id>,
    pub created_at: String,
    pub updated_at: String,
    // Stock fields
    pub stock_id: Id,
    pub stock_quantity: i32,
    pub min_stock_level: i32,
    pub unit_price: f64,
    pub last_restocked_at: Option<String>,
    pub stock_updated_at: String,
}

impl From<Model> for InventoryItemResponse {
    fn from(model: Model) -> Self {
        Self {
            id: model.id,
            name: model.name,
            generic_name: model.generic_name,
            concentration: model.concentration,
            form: model.form,
            manufacturer: model.manufacturer,
            barcode: model.barcode,
            requires_prescription: model.requires_prescription,
            is_controlled: model.is_controlled,
            storage_instructions: model.storage_instructions,
            notes: model.notes,
            is_active: model.is_active,
            created_by: model.created_by,
            updated_by: model.updated_by,
            created_at: model.created_at.to_string(),
            updated_at: model.updated_at.to_string(),
        }
    }
}
