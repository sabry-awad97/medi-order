use super::Id;
use super::Model;
use serde::{Deserialize, Serialize};

/// Response DTO for price history entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PriceHistoryResponse {
    pub id: Id,
    pub inventory_item_id: Id,
    pub unit_price: f64,     // Converted from Decimal for JSON
    pub recorded_at: String, // ISO 8601 timestamp
    pub changed_by: Option<Id>,
    pub reason: Option<String>,
}

impl From<Model> for PriceHistoryResponse {
    fn from(model: Model) -> Self {
        Self {
            id: model.id,
            inventory_item_id: model.inventory_item_id,
            unit_price: model.unit_price.to_string().parse().unwrap_or(0.0),
            recorded_at: model.recorded_at.to_string(),
            changed_by: model.changed_by,
            reason: model.reason,
        }
    }
}

/// Price statistics DTO
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PriceStatistics {
    pub min_price: f64,
    pub max_price: f64,
    pub avg_price: f64,
    pub entry_count: usize,
}

/// Query filter for price history
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PriceHistoryQueryDto {
    pub inventory_item_id: Id,
    pub limit: Option<u64>,
}
