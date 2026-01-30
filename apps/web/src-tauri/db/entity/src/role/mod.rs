pub mod dto;

use super::id::Id;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// Role entity - represents user roles and permissions
/// Optimized for PostgreSQL with native types
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "roles")]
pub struct Model {
    /// Primary key - PostgreSQL UUID type
    #[sea_orm(primary_key, auto_increment = false, column_type = "Uuid")]
    pub id: Id,

    /// Unique role name (e.g., "admin", "pharmacist", "technician", "viewer") - VARCHAR(50)
    #[sea_orm(unique, column_type = "String(StringLen::N(50))")]
    pub name: String,

    /// Human-readable display name - VARCHAR(100)
    #[sea_orm(column_type = "String(StringLen::N(100))")]
    pub display_name: String,

    /// Role description - TEXT (nullable)
    #[sea_orm(column_type = "Text", nullable)]
    pub description: Option<String>,

    /// Permission level (higher = more permissions) - PostgreSQL INTEGER
    #[sea_orm(column_type = "Integer")]
    pub level: i32,

    /// Whether this is a system role (cannot be deleted) - PostgreSQL BOOLEAN
    pub is_system: bool,

    /// Whether this role is active - PostgreSQL BOOLEAN
    pub is_active: bool,

    // === Permissions ===
    /// JSON array of permissions - PostgreSQL JSONB for efficient querying
    #[sea_orm(column_type = "JsonBinary")]
    pub permissions: Json,

    // === Audit & Compliance ===
    /// User who created this role - UUID (nullable)
    #[sea_orm(column_type = "Uuid", nullable)]
    pub created_by: Option<Id>,

    /// User who last modified this role - UUID (nullable)
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
    /// One-to-many: Role has many users
    #[sea_orm(has_many = "super::user::Entity")]
    Users,
}

impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Users.def()
    }
}

#[async_trait::async_trait]
impl ActiveModelBehavior for ActiveModel {
    /// Called before insert - generate ID if not set
    fn new() -> Self {
        Self {
            id: sea_orm::ActiveValue::Set(Id::new()),
            created_at: sea_orm::ActiveValue::Set(chrono::Utc::now().into()),
            updated_at: sea_orm::ActiveValue::Set(chrono::Utc::now().into()),
            ..Default::default()
        }
    }

    /// Called before update - update timestamp
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
