pub mod dto;

use super::id::Id;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// User status enum - PostgreSQL native enum type
#[derive(Debug, Clone, Copy, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "user_status")]
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
/// Optimized for PostgreSQL with native types
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "users")]
pub struct Model {
    /// Primary key - PostgreSQL UUID type
    #[sea_orm(primary_key, auto_increment = false, column_type = "Uuid")]
    pub id: Id,

    /// Required link to staff member - PostgreSQL UUID with UNIQUE constraint
    #[sea_orm(unique, column_type = "Uuid")]
    pub staff_id: Id,

    // === Authentication & Identity ===
    /// Unique username for login - VARCHAR(100)
    #[sea_orm(unique, column_type = "String(StringLen::N(100))")]
    pub username: String,

    /// Unique email address for login - VARCHAR(255)
    #[sea_orm(unique, column_type = "String(StringLen::N(255))")]
    pub email: String,

    /// Hashed password - TEXT type for bcrypt/argon2 hashes
    #[sea_orm(column_type = "Text")]
    pub password_hash: String,

    // === Profile Information ===
    /// First name - VARCHAR(100)
    #[sea_orm(column_type = "String(StringLen::N(100))")]
    pub first_name: String,

    /// Last name - VARCHAR(100)
    #[sea_orm(column_type = "String(StringLen::N(100))")]
    pub last_name: String,

    /// Display name (can be different from first+last) - VARCHAR(200) (nullable)
    #[sea_orm(column_type = "String(StringLen::N(200))", nullable)]
    pub display_name: Option<String>,

    /// Profile avatar URL or path - TEXT (nullable)
    #[sea_orm(column_type = "Text", nullable)]
    pub avatar_url: Option<String>,

    // === Professional Information ===
    /// NPI (National Provider Identifier) - VARCHAR(10) (nullable)
    #[sea_orm(column_type = "String(StringLen::N(10))", nullable)]
    pub npi_number: Option<String>,

    /// Supervisor's user ID (organizational hierarchy) - UUID (nullable)
    #[sea_orm(column_type = "Uuid", nullable)]
    pub supervisor_id: Option<Id>,

    // === Authorization ===
    /// User role ID (foreign key to roles table) - PostgreSQL UUID
    #[sea_orm(column_type = "Uuid")]
    pub role_id: Id,

    // === System & Security ===
    /// Current account status - PostgreSQL ENUM type
    pub status: UserStatus,

    /// Whether the user account is active - PostgreSQL BOOLEAN
    pub is_active: bool,

    /// Last login timestamp - PostgreSQL TIMESTAMPTZ (nullable)
    #[sea_orm(column_type = "TimestampWithTimeZone", nullable)]
    pub last_login_at: Option<DateTimeWithTimeZone>,

    // === Audit & Compliance ===
    /// User who created this account - UUID (nullable)
    #[sea_orm(column_type = "Uuid", nullable)]
    pub created_by: Option<Id>,

    /// User who last modified this account - UUID (nullable)
    #[sea_orm(column_type = "Uuid", nullable)]
    pub updated_by: Option<Id>,

    /// Account creation timestamp - PostgreSQL TIMESTAMPTZ
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
