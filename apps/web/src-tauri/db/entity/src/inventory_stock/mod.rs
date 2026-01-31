pub mod dto;

use super::id::Id;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// Inventory stock entity - represents current stock levels and pricing
/// This table contains frequently-changing transactional data
/// Separated from inventory_items (catalog) for better performance
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "inventory_stock")]
pub struct Model {
    /// Primary key - PostgreSQL UUID type
    #[sea_orm(primary_key, auto_increment = false, column_type = "Uuid")]
    pub id: Id,

    /// Foreign key to inventory_items - PostgreSQL UUID type
    #[sea_orm(column_type = "Uuid")]
    pub inventory_item_id: Id,

    /// Current stock quantity - INTEGER
    #[sea_orm(column_type = "Integer")]
    pub stock_quantity: i32,

    /// Minimum stock level for alerts - INTEGER
    #[sea_orm(column_type = "Integer")]
    pub min_stock_level: i32,

    /// Unit price - DECIMAL(10,2)
    #[sea_orm(column_type = "Decimal(Some((10, 2)))")]
    pub unit_price: Decimal,

    /// Last time stock was restocked - PostgreSQL TIMESTAMPTZ (nullable)
    #[sea_orm(column_type = "TimestampWithTimeZone", nullable)]
    pub last_restocked_at: Option<DateTimeWithTimeZone>,

    /// Last update timestamp - PostgreSQL TIMESTAMPTZ (auto-updated)
    #[sea_orm(column_type = "TimestampWithTimeZone")]
    pub updated_at: DateTimeWithTimeZone,

    /// Record creation timestamp - PostgreSQL TIMESTAMPTZ
    #[sea_orm(column_type = "TimestampWithTimeZone")]
    pub created_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// Many-to-one: Stock record belongs to one inventory item
    #[sea_orm(
        belongs_to = "super::inventory_item::Entity",
        from = "Column::InventoryItemId",
        to = "super::inventory_item::Column::Id"
    )]
    InventoryItem,
}

impl Related<super::inventory_item::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::InventoryItem.def()
    }
}

#[async_trait::async_trait]
impl ActiveModelBehavior for ActiveModel {
    /// Called before insert - generate ID and set timestamps
    fn new() -> Self {
        Self {
            id: sea_orm::ActiveValue::Set(Id::new()),
            stock_quantity: sea_orm::ActiveValue::Set(0),
            min_stock_level: sea_orm::ActiveValue::Set(10),
            created_at: sea_orm::ActiveValue::Set(chrono::Utc::now().into()),
            updated_at: sea_orm::ActiveValue::Set(chrono::Utc::now().into()),
            ..Default::default()
        }
    }

    /// Called before save - update timestamp on modifications
    async fn before_save<C>(mut self, _db: &C, insert: bool) -> Result<Self, DbErr>
    where
        C: ConnectionTrait,
    {
        if !insert {
            self.updated_at = sea_orm::ActiveValue::Set(chrono::Utc::now().into());
        }
        Ok(self)
    }
}
