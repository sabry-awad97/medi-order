pub mod dto;

use super::id::Id;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// User status enum
#[derive(Debug, Clone, Copy, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::N(50))")]
pub enum UserStatus {
    #[sea_orm(string_value = "active")]
    Active,
    #[sea_orm(string_value = "inactive")]
    Inactive,
    #[sea_orm(string_value = "suspended")]
    Suspended,
    #[sea_orm(string_value = "pending_verification")]
    PendingVerification,
}

/// User entity - represents staff members with app access (authentication/authorization layer)
/// Every user MUST be a staff member (required staff_id)
/// This entity adds authentication and permission capabilities to staff members
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "users")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Id,

    /// Required link to staff member - every user is a staff member
    #[sea_orm(unique)]
    pub staff_id: Id,

    // === Authentication & Identity ===
    /// Unique username for login
    #[sea_orm(unique)]
    pub username: String,

    /// Unique email address for login
    #[sea_orm(unique)]
    pub email: String,

    /// Hashed password
    pub password_hash: String,

    // === Profile Information ===
    /// First name
    pub first_name: String,

    /// Last name
    pub last_name: String,

    /// Display name (can be different from first+last)
    pub display_name: Option<String>,

    /// Profile avatar URL or path
    pub avatar_url: Option<String>,

    // === Professional Information ===
    /// NPI (National Provider Identifier)
    pub npi_number: Option<String>,

    /// Supervisor's user ID (organizational hierarchy)
    pub supervisor_id: Option<Id>,

    // === Authorization ===
    /// User role ID (foreign key to roles table)
    pub role_id: Id,

    // === System & Security ===
    /// Current account status
    pub status: UserStatus,

    /// Whether the user account is active (can be inactive even if staff is active)
    pub is_active: bool,

    /// Last login timestamp with timezone
    pub last_login_at: Option<DateTimeWithTimeZone>,

    // === Audit & Compliance ===
    /// User who created this account
    pub created_by: Option<Id>,

    /// User who last modified this account
    pub updated_by: Option<Id>,

    /// Account creation timestamp with timezone
    pub created_at: DateTimeWithTimeZone,

    /// Last update timestamp with timezone
    pub updated_at: DateTimeWithTimeZone,

    /// Soft deletion timestamp with timezone
    pub deleted_at: Option<DateTimeWithTimeZone>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// One-to-one: User belongs to exactly one staff member
    #[sea_orm(
        belongs_to = "super::staff::Entity",
        from = "Column::StaffId",
        to = "super::staff::Column::Id"
    )]
    Staff,

    /// Many-to-one: User belongs to one role
    #[sea_orm(
        belongs_to = "super::role::Entity",
        from = "Column::RoleId",
        to = "super::role::Column::Id"
    )]
    Role,

    /// Self-referential: User may have a supervisor
    #[sea_orm(
        belongs_to = "Entity",
        from = "Column::SupervisorId",
        to = "Column::Id"
    )]
    Supervisor,
}

impl Related<super::staff::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Staff.def()
    }
}

impl Related<super::role::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Role.def()
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
