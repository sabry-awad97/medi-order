pub mod dto;

use super::id::Id;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// Employment status enum - PostgreSQL native enum type
#[derive(Debug, Clone, Copy, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "employment_status")]
pub enum EmploymentStatus {
    #[sea_orm(string_value = "active")]
    Active,
    #[sea_orm(string_value = "on_leave")]
    OnLeave,
    #[sea_orm(string_value = "terminated")]
    Terminated,
}

/// Work schedule enum - PostgreSQL native enum type
#[derive(Debug, Clone, Copy, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "work_schedule")]
pub enum WorkSchedule {
    #[sea_orm(string_value = "full_time")]
    FullTime,
    #[sea_orm(string_value = "part_time")]
    PartTime,
    #[sea_orm(string_value = "contract")]
    Contract,
}

/// Staff entity - represents all actively working employees
/// Optimized for PostgreSQL with native types
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "staff")]
pub struct Model {
    /// Primary key - PostgreSQL UUID type
    #[sea_orm(primary_key, auto_increment = false, column_type = "Uuid")]
    pub id: Id,

    /// Full name - PostgreSQL TEXT type (unlimited length)
    #[sea_orm(column_type = "Text")]
    pub full_name: String,

    /// Employee ID - VARCHAR(50) with UNIQUE constraint
    #[sea_orm(unique, column_type = "String(StringLen::N(50))")]
    pub employee_id: String,

    /// Job title/position - TEXT type
    #[sea_orm(column_type = "Text")]
    pub position: String,

    /// Department - TEXT type
    #[sea_orm(column_type = "Text")]
    pub department: String,

    /// Contact phone - VARCHAR(20)
    #[sea_orm(column_type = "String(StringLen::N(20))")]
    pub phone: String,

    /// Contact email - VARCHAR(255) for email standard
    #[sea_orm(column_type = "String(StringLen::N(255))")]
    pub email: String,

    /// Employment status - PostgreSQL ENUM type
    pub employment_status: EmploymentStatus,

    /// Date of hire - PostgreSQL DATE type
    pub hire_date: Date,

    /// Date of termination - PostgreSQL DATE type (nullable)
    pub termination_date: Option<Date>,

    /// Work schedule - PostgreSQL ENUM type
    pub work_schedule: WorkSchedule,

    /// Compensation - PostgreSQL NUMERIC(12,2) for precise decimal
    #[sea_orm(column_type = "Decimal(Some((12, 2)))")]
    pub compensation: Option<Decimal>,

    /// Emergency contact name - TEXT (nullable)
    #[sea_orm(column_type = "Text", nullable)]
    pub emergency_contact_name: Option<String>,

    /// Emergency contact phone - VARCHAR(20) (nullable)
    #[sea_orm(column_type = "String(StringLen::N(20))", nullable)]
    pub emergency_contact_phone: Option<String>,

    /// Additional notes - TEXT (nullable)
    #[sea_orm(column_type = "Text", nullable)]
    pub notes: Option<String>,

    // === Audit & Compliance ===
    /// User who created this record - UUID (nullable)
    #[sea_orm(column_type = "Uuid", nullable)]
    pub created_by: Option<Id>,

    /// User who last modified this record - UUID (nullable)
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
    /// One-to-one: Staff member may have app access via User entity
    #[sea_orm(has_one = "super::user::Entity")]
    User,
}

impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::User.def()
    }
}

#[async_trait::async_trait]
impl ActiveModelBehavior for ActiveModel {
    /// Called before insert - generate ID and set timestamps
    fn new() -> Self {
        Self {
            id: sea_orm::ActiveValue::Set(Id::new()),
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
