pub mod dto;

use super::id::Id;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// Role entity - represents user roles and permissions
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "roles")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Id,

    /// Unique role name (e.g., "admin", "pharmacist", "technician", "viewer")
    #[sea_orm(unique)]
    pub name: String,

    /// Human-readable display name
    pub display_name: String,

    /// Role description
    pub description: Option<String>,

    /// Permission level (higher = more permissions)
    pub level: i32,

    /// Whether this is a system role (cannot be deleted)
    pub is_system: bool,

    /// Whether this role is active
    pub is_active: bool,

    // === Permissions (JSON or separate table) ===
    /// JSON array of permissions
    #[sea_orm(column_type = "Json")]
    pub permissions: Json,

    // === Audit & Compliance ===
    /// User who created this role
    pub created_by: Option<Id>,

    /// User who last modified this role
    pub updated_by: Option<Id>,

    /// Record creation timestamp with timezone
    pub created_at: DateTimeWithTimeZone,

    /// Last update timestamp with timezone
    pub updated_at: DateTimeWithTimeZone,

    /// Soft deletion timestamp with timezone
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
