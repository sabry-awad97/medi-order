pub mod dto;

use super::id::Id;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// Session entity - tracks active user sessions for multi-user environments
/// Optimized for PostgreSQL with native types
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "sessions")]
pub struct Model {
    /// Primary key - PostgreSQL UUID type
    #[sea_orm(primary_key, auto_increment = false, column_type = "Uuid")]
    pub id: Id,

    /// User ID - foreign key to users table
    #[sea_orm(column_type = "Uuid")]
    pub user_id: Id,

    /// Session token - unique identifier for this session
    #[sea_orm(unique, column_type = "String(StringLen::N(255))")]
    pub token: String,

    /// IP address of the client (for security tracking)
    #[sea_orm(column_type = "String(StringLen::N(45))", nullable)]
    pub ip_address: Option<String>,

    /// User agent string (browser/app info)
    #[sea_orm(column_type = "Text", nullable)]
    pub user_agent: Option<String>,

    /// Session expiration timestamp
    #[sea_orm(column_type = "TimestampWithTimeZone")]
    pub expires_at: DateTimeWithTimeZone,

    /// Last activity timestamp (for idle timeout)
    #[sea_orm(column_type = "TimestampWithTimeZone")]
    pub last_activity_at: DateTimeWithTimeZone,

    /// Session creation timestamp
    #[sea_orm(column_type = "TimestampWithTimeZone")]
    pub created_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// Many-to-one: Session belongs to one user
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::UserId",
        to = "super::user::Column::Id",
        on_delete = "Cascade"
    )]
    User,
}

impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::User.def()
    }
}

#[async_trait::async_trait]
impl ActiveModelBehavior for ActiveModel {
    /// Called before insert - generate ID if not set
    fn new() -> Self {
        let now = chrono::Utc::now();
        Self {
            id: sea_orm::ActiveValue::Set(Id::new()),
            created_at: sea_orm::ActiveValue::Set(now.into()),
            last_activity_at: sea_orm::ActiveValue::Set(now.into()),
            ..Default::default()
        }
    }
}
