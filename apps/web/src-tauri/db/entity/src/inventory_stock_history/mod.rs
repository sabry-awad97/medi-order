pub mod dto;

use super::id::Id;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// Stock adjustment type enum
#[derive(Debug, Clone, PartialEq, Eq, Hash, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(
    rs_type = "String",
    db_type = "Enum",
    enum_name = "stock_adjustment_type"
)]
#[serde(rename_all = "snake_case")]
pub enum StockAdjustmentType {
    #[sea_orm(string_value = "manual_adjustment")]
    ManualAdjustment,
    #[sea_orm(string_value = "order_arrival")]
    OrderArrival,
    #[sea_orm(string_value = "sale")]
    Sale,
    #[sea_orm(string_value = "damage")]
    Damage,
    #[sea_orm(string_value = "expiry")]
    Expiry,
    #[sea_orm(string_value = "return")]
    Return,
    #[sea_orm(string_value = "transfer")]
    Transfer,
    #[sea_orm(string_value = "initial_stock")]
    InitialStock,
    #[sea_orm(string_value = "opening_balance")]
    OpeningBalance,
}

/// Stock history entity - tracks all stock quantity changes
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "inventory_stock_history")]
pub struct Model {
    /// Primary key - PostgreSQL UUID type
    #[sea_orm(primary_key, auto_increment = false, column_type = "Uuid")]
    pub id: Id,

    /// Foreign key to inventory_items - PostgreSQL UUID type
    #[sea_orm(column_type = "Uuid")]
    pub inventory_item_id: Id,

    /// Type of stock adjustment
    pub adjustment_type: StockAdjustmentType,

    /// Stock quantity before adjustment
    pub quantity_before: i32,

    /// Stock quantity after adjustment
    pub quantity_after: i32,

    /// Adjustment amount (can be negative)
    pub adjustment_amount: i32,

    /// Optional reason for adjustment - TEXT (nullable)
    #[sea_orm(column_type = "Text", nullable)]
    pub reason: Option<String>,

    /// Optional reference to related entity (order, sale, etc.) - UUID (nullable)
    #[sea_orm(column_type = "Uuid", nullable)]
    pub reference_id: Option<Id>,

    /// Type of reference (order, sale, etc.) - VARCHAR(50) (nullable)
    #[sea_orm(column_type = "String(StringLen::N(50))", nullable)]
    pub reference_type: Option<String>,

    /// When this adjustment was recorded - PostgreSQL TIMESTAMPTZ
    #[sea_orm(column_type = "TimestampWithTimeZone")]
    pub recorded_at: DateTimeWithTimeZone,

    /// User who made the adjustment - PostgreSQL UUID (nullable)
    #[sea_orm(column_type = "Uuid", nullable)]
    pub recorded_by: Option<Id>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// Many-to-one: Stock history entry belongs to one inventory item
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
impl ActiveModelBehavior for ActiveModel {}
