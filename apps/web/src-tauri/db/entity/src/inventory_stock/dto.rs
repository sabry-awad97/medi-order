use super::Id;
use super::Model;
use serde::{Deserialize, Serialize};

/// DTO for creating a new inventory stock record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateInventoryStock {
    pub inventory_item_id: Id,
    pub stock_quantity: i32,
    pub min_stock_level: i32,
    pub unit_price: f64,
}

/// DTO for updating inventory stock
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateInventoryStock {
    pub stock_quantity: Option<i32>,
    pub min_stock_level: Option<i32>,
    pub unit_price: Option<f64>,
}

/// DTO for stock adjustment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdjustStock {
    pub adjustment: i32, // Positive for add, negative for subtract
    pub reason: Option<String>,
    pub adjustment_type: Option<super::super::inventory_stock_history::StockAdjustmentType>,
}

/// DTO for inventory stock response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InventoryStockResponse {
    pub id: Id,
    pub inventory_item_id: Id,
    pub stock_quantity: i32,
    pub min_stock_level: i32,
    pub unit_price: f64,
    pub last_restocked_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl From<Model> for InventoryStockResponse {
    fn from(model: Model) -> Self {
        Self {
            id: model.id,
            inventory_item_id: model.inventory_item_id,
            stock_quantity: model.stock_quantity,
            min_stock_level: model.min_stock_level,
            unit_price: model.unit_price.to_string().parse().unwrap_or(0.0),
            last_restocked_at: model.last_restocked_at.map(|dt| dt.to_string()),
            created_at: model.created_at.to_string(),
            updated_at: model.updated_at.to_string(),
        }
    }
}
