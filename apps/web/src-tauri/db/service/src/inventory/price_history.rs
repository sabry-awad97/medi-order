use std::sync::Arc;

use db_entity::id::Id;
use db_entity::inventory_price_history::dto::{PriceHistoryResponse, PriceStatistics};
use db_entity::inventory_price_history::{self, Entity as PriceHistory};
use sea_orm::*;
use tap::TapFallible;

use crate::error::ServiceResult;

/// Price history service for managing historical price data
pub struct PriceHistoryService {
    db: Arc<DatabaseConnection>,
}

impl PriceHistoryService {
    /// Create a new price history service
    pub fn new(db: Arc<DatabaseConnection>) -> Self {
        Self { db }
    }

    /// Get price history for an inventory item
    ///
    /// # Arguments
    /// * `inventory_item_id` - The ID of the inventory item
    /// * `limit` - Optional limit on number of entries to return
    ///
    /// # Returns
    /// Vector of price history entries ordered by recorded_at descending
    pub async fn get_price_history(
        &self,
        inventory_item_id: Id,
        limit: Option<u64>,
    ) -> ServiceResult<Vec<PriceHistoryResponse>> {
        let mut query = PriceHistory::find()
            .filter(inventory_price_history::Column::InventoryItemId.eq(inventory_item_id))
            .order_by_desc(inventory_price_history::Column::RecordedAt);

        if let Some(limit) = limit {
            query = query.limit(limit);
        }

        let entries = query.all(&*self.db).await.tap_err(|e| {
            tracing::error!(
                "Failed to get price history for item {}: {}",
                inventory_item_id,
                e
            )
        })?;

        Ok(entries
            .into_iter()
            .map(PriceHistoryResponse::from)
            .collect())
    }

    /// Get the latest price entry for an inventory item
    ///
    /// # Arguments
    /// * `inventory_item_id` - The ID of the inventory item
    ///
    /// # Returns
    /// The most recent price history entry, or None if no history exists
    pub async fn get_latest_price(
        &self,
        inventory_item_id: Id,
    ) -> ServiceResult<Option<PriceHistoryResponse>> {
        let entry = PriceHistory::find()
            .filter(inventory_price_history::Column::InventoryItemId.eq(inventory_item_id))
            .order_by_desc(inventory_price_history::Column::RecordedAt)
            .one(&*self.db)
            .await
            .tap_err(|e| {
                tracing::error!(
                    "Failed to get latest price for item {}: {}",
                    inventory_item_id,
                    e
                )
            })?;

        Ok(entry.map(PriceHistoryResponse::from))
    }

    /// Get price statistics for an inventory item
    ///
    /// # Arguments
    /// * `inventory_item_id` - The ID of the inventory item
    ///
    /// # Returns
    /// Price statistics including min, max, and average prices
    pub async fn get_price_statistics(
        &self,
        inventory_item_id: Id,
    ) -> ServiceResult<PriceStatistics> {
        let entries = PriceHistory::find()
            .filter(inventory_price_history::Column::InventoryItemId.eq(inventory_item_id))
            .all(&*self.db)
            .await
            .tap_err(|e| {
                tracing::error!(
                    "Failed to get price statistics for item {}: {}",
                    inventory_item_id,
                    e
                )
            })?;

        if entries.is_empty() {
            // Return zero statistics if no history
            return Ok(PriceStatistics {
                min_price: 0.0,
                max_price: 0.0,
                avg_price: 0.0,
                entry_count: 0,
            });
        }

        let prices: Vec<f64> = entries
            .iter()
            .filter_map(|e| e.unit_price.to_string().parse().ok())
            .collect();

        let min_price = prices.iter().cloned().fold(f64::INFINITY, f64::min);
        let max_price = prices.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
        let avg_price = prices.iter().sum::<f64>() / prices.len() as f64;

        Ok(PriceStatistics {
            min_price,
            max_price,
            avg_price,
            entry_count: entries.len(),
        })
    }
}
