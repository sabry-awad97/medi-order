pub mod dto;

use super::id::Id;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// Inventory item entity - represents medicine catalog
/// Optimized for PostgreSQL with native types
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "inventory_items")]
pub struct Model {
    /// Primary key - PostgreSQL UUID type
    #[sea_orm(primary_key, auto_increment = false, column_type = "Uuid")]
    pub id: Id,

    /// Medicine name - VARCHAR(200)
    #[sea_orm(column_type = "String(StringLen::N(200))")]
    pub name: String,

    /// Generic/scientific name - VARCHAR(200) (nullable)
    #[sea_orm(column_type = "String(StringLen::N(200))", nullable)]
    pub generic_name: Option<String>,

    /// Concentration/strength (e.g., "500mg", "10mg/ml") - VARCHAR(50)
    #[sea_orm(column_type = "String(StringLen::N(50))")]
    pub concentration: String,

    /// Dosage form (e.g., "tablet", "capsule", "syrup") - VARCHAR(50)
    #[sea_orm(column_type = "String(StringLen::N(50))")]
    pub form: String,

    /// Manufacturer name - VARCHAR(200) (nullable)
    #[sea_orm(column_type = "String(StringLen::N(200))", nullable)]
    pub manufacturer: Option<String>,

    /// Barcode/SKU - VARCHAR(100) (nullable, unique)
    #[sea_orm(column_type = "String(StringLen::N(100))", nullable, unique)]
    pub barcode: Option<String>,

    /// Whether item requires prescription - BOOLEAN
    pub requires_prescription: bool,

    /// Whether item is controlled substance - BOOLEAN
    pub is_controlled: bool,

    /// Storage instructions - TEXT (nullable)
    #[sea_orm(column_type = "Text", nullable)]
    pub storage_instructions: Option<String>,

    /// Additional notes - TEXT (nullable)
    #[sea_orm(column_type = "Text", nullable)]
    pub notes: Option<String>,

    /// Whether item is active in catalog - BOOLEAN
    pub is_active: bool,

    // === Audit & Compliance ===
    /// User who created this item - UUID (nullable)
    #[sea_orm(column_type = "Uuid", nullable)]
    pub created_by: Option<Id>,

    /// User who last modified this item - UUID (nullable)
    #[sea_orm(column_type = "Uuid", nullable)]
    pub updated_by: Option<Id>,

    /// Record creation timestamp - PostgreSQL TIMESTAMPTZ
    #[sea_orm(column_type = "TimestampWithTimeZone")]
    pub created_at: DateTimeWithTimeZone,

    /// Last update timestamp - PostgreSQL TIMESTAMPTZ (auto-updated)
    #[sea_orm(column_type = "TimestampWithTimeZone")]
    pub updated_at: DateTimeWithTimeZone,

    /// Soft deletion timestamp - PostgreSQL TIMESTAMPTZ (nullable)
    #[sea_orm(column_type = "TimestampWithTimeZone", nullable)]
    pub deleted_at: Option<DateTimeWithTimeZone>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// One-to-many: Inventory item appears in many special order items
    #[sea_orm(has_many = "super::special_order_item::Entity")]
    SpecialOrderItems,

    /// One-to-many: Inventory item has many supplier-inventory item relationships
    #[sea_orm(has_many = "super::supplier_inventory_item::Entity")]
    SupplierInventoryItems,

    /// One-to-one: Inventory item has one stock record
    #[sea_orm(has_one = "super::inventory_stock::Entity")]
    InventoryStock,
}

impl Related<super::special_order_item::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::SpecialOrderItems.def()
    }
}

impl Related<super::supplier_inventory_item::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::SupplierInventoryItems.def()
    }
}

impl Related<super::inventory_stock::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::InventoryStock.def()
    }
}

// Many-to-many relationship with Supplier through SupplierInventoryItem
impl Related<super::supplier::Entity> for Entity {
    fn to() -> RelationDef {
        super::supplier_inventory_item::Relation::Supplier.def()
    }

    fn via() -> Option<RelationDef> {
        Some(
            super::supplier_inventory_item::Relation::InventoryItem
                .def()
                .rev(),
        )
    }
}

#[async_trait::async_trait]
impl ActiveModelBehavior for ActiveModel {
    /// Called before insert - generate ID and set timestamps
    fn new() -> Self {
        Self {
            id: sea_orm::ActiveValue::Set(Id::new()),
            requires_prescription: sea_orm::ActiveValue::Set(false),
            is_controlled: sea_orm::ActiveValue::Set(false),
            is_active: sea_orm::ActiveValue::Set(true),
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
