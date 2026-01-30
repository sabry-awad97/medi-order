pub mod dto;

use super::id::Id;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// Employment status enum
#[derive(Debug, Clone, Copy, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::N(50))")]
pub enum EmploymentStatus {
    #[sea_orm(string_value = "active")]
    Active,
    #[sea_orm(string_value = "on_leave")]
    OnLeave,
    #[sea_orm(string_value = "terminated")]
    Terminated,
}

/// Work schedule enum
#[derive(Debug, Clone, Copy, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::N(50))")]
pub enum WorkSchedule {
    #[sea_orm(string_value = "full_time")]
    FullTime,
    #[sea_orm(string_value = "part_time")]
    PartTime,
    #[sea_orm(string_value = "contract")]
    Contract,
}

/// Staff entity - represents all actively working employees
/// This is the base entity for all staff members
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "staff")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Id,

    /// Full name of staff member
    pub full_name: String,

    /// Employee ID or badge number
    #[sea_orm(unique)]
    pub employee_id: String,

    /// Job title/position
    pub position: String,

    /// Department (pharmacy, administration, etc.)
    pub department: String,

    /// Contact phone number
    pub phone: String,

    /// Contact email
    pub email: String,

    /// Employment status (active, on_leave, terminated)
    pub employment_status: EmploymentStatus,

    /// Date of hire
    pub hire_date: Date,

    /// Date of termination (if applicable)
    pub termination_date: Option<Date>,

    /// Work schedule (full_time, part_time, contract)
    pub work_schedule: WorkSchedule,

    /// Hourly rate or salary
    pub compensation: Option<Decimal>,

    /// Emergency contact name
    pub emergency_contact_name: Option<String>,

    /// Emergency contact phone
    pub emergency_contact_phone: Option<String>,

    /// Additional notes
    pub notes: Option<String>,

    // === Audit & Compliance ===
    /// User who created this record
    pub created_by: Option<Id>,

    /// User who last modified this record
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
