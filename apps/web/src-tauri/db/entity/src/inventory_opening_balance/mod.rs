pub mod dto;

use super::id::Id;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// Opening balance entry type enum
#[derive(Debug, Clone, PartialEq, Eq, Hash, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(
    rs_type = "String",
    db_type = "Enum",
    enum_name = "opening_balance_entry_type"
)]
#[serde(rename_all = "snake_case")]
pub enum OpeningBalanceEntryType {
    #[sea_orm(string_value = "initial")]
    Initial,
    #[sea_orm(string_value = "adjustment")]
    Adjustment,
    #[sea_orm(string_value = "correction")]
    Correction,
    #[sea_orm(string_value = "reconciliation")]
    Reconciliation,
}

/// Opening balance entity - tracks initial stock quantities and adjustments
/// This table maintains an immutable audit trail of all opening balance entries
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "inventory_opening_balances")]
pub struct Model {
    /// Primary key - PostgreSQL UUID type
    #[sea_orm(primary_key, auto_increment = false, column_type = "Uuid")]
    pub id: Id,

    /// Foreign key to inventory_items - PostgreSQL UUID type
    #[sea_orm(column_type = "Uuid")]
    pub inventory_item_id: Id,

    /// User who entered this opening balance - PostgreSQL UUID type
    #[sea_orm(column_type = "Uuid")]
    pub entered_by: Id,

    /// Reference to original entry if this is an adjustment - PostgreSQL UUID (nullable)
    #[sea_orm(column_type = "Uuid", nullable)]
    pub adjusted_from_id: Option<Id>,

    /// Opening balance quantity - INTEGER
    #[sea_orm(column_type = "Integer")]
    pub quantity: i32,

    /// Unit price at time of opening balance - DECIMAL(10,2)
    #[sea_orm(column_type = "Decimal(Some((10, 2)))")]
    pub unit_price: Decimal,

    /// Optional batch/lot number - VARCHAR(100) (nullable)
    #[sea_orm(column_type = "String(StringLen::N(100))", nullable)]
    pub batch_number: Option<String>,

    /// Optional expiry date - DATE (nullable)
    #[sea_orm(column_type = "Date", nullable)]
    pub expiry_date: Option<Date>,

    /// Date of opening balance entry - DATE
    #[sea_orm(column_type = "Date")]
    pub entry_date: Date,

    /// Type of opening balance entry
    pub entry_type: OpeningBalanceEntryType,

    /// Optional reason for entry - TEXT (nullable)
    #[sea_orm(column_type = "Text", nullable)]
    pub reason: Option<String>,

    /// Optional additional notes - TEXT (nullable)
    #[sea_orm(column_type = "Text", nullable)]
    pub notes: Option<String>,

    /// Import batch ID for bulk imports - PostgreSQL UUID (nullable)
    #[sea_orm(column_type = "Uuid", nullable)]
    pub import_batch_id: Option<Id>,

    /// Import file name for bulk imports - VARCHAR(255) (nullable)
    #[sea_orm(column_type = "String(StringLen::N(255))", nullable)]
    pub import_file_name: Option<String>,

    /// Whether this entry is active (soft delete) - BOOLEAN
    pub is_active: bool,

    /// Whether this entry has been verified - BOOLEAN
    pub is_verified: bool,

    /// User who verified this entry - PostgreSQL UUID (nullable)
    #[sea_orm(column_type = "Uuid", nullable)]
    pub verified_by: Option<Id>,

    /// When this entry was verified - PostgreSQL TIMESTAMPTZ (nullable)
    #[sea_orm(column_type = "TimestampWithTimeZone", nullable)]
    pub verified_at: Option<DateTimeWithTimeZone>,

    /// Record creation timestamp - PostgreSQL TIMESTAMPTZ
    #[sea_orm(column_type = "TimestampWithTimeZone")]
    pub created_at: DateTimeWithTimeZone,

    /// Last update timestamp - PostgreSQL TIMESTAMPTZ (auto-updated)
    #[sea_orm(column_type = "TimestampWithTimeZone")]
    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// Many-to-one: Opening balance belongs to one inventory item
    #[sea_orm(
        belongs_to = "super::inventory_item::Entity",
        from = "Column::InventoryItemId",
        to = "super::inventory_item::Column::Id"
    )]
    InventoryItem,

    /// Many-to-one: Opening balance entered by one user
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::EnteredBy",
        to = "super::user::Column::Id"
    )]
    EnteredByUser,

    /// Many-to-one: Opening balance verified by one user (optional)
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::VerifiedBy",
        to = "super::user::Column::Id"
    )]
    VerifiedByUser,
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
            entry_type: sea_orm::ActiveValue::Set(OpeningBalanceEntryType::Initial),
            is_active: sea_orm::ActiveValue::Set(true),
            is_verified: sea_orm::ActiveValue::Set(false),
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
