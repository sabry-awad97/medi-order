use crate::id::Id;
use crate::staff::{EmploymentStatus, WorkSchedule};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// DTO for creating a new staff member
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateStaffDto {
    pub full_name: String,
    pub employee_id: String,
    pub position: String,
    pub department: String,
    pub phone: String,
    pub email: String,
    pub employment_status: EmploymentStatus,
    pub hire_date: Date,
    pub work_schedule: WorkSchedule,
    pub compensation: Option<Decimal>,
    pub emergency_contact_name: Option<String>,
    pub emergency_contact_phone: Option<String>,
    pub notes: Option<String>,
}

/// DTO for updating an existing staff member
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateStaffDto {
    pub full_name: Option<String>,
    pub employee_id: Option<String>,
    pub position: Option<String>,
    pub department: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub employment_status: Option<EmploymentStatus>,
    pub hire_date: Option<Date>,
    pub termination_date: Option<Date>,
    pub work_schedule: Option<WorkSchedule>,
    pub compensation: Option<Decimal>,
    pub emergency_contact_name: Option<String>,
    pub emergency_contact_phone: Option<String>,
    pub notes: Option<String>,
}

/// DTO for staff query filters
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct StaffQueryDto {
    pub id: Option<Id>,
    pub employee_id: Option<String>,
    pub employment_status: Option<EmploymentStatus>,
    pub department: Option<String>,
    pub position: Option<String>,
    pub search: Option<String>, // Search by name, email, or employee_id
    pub include_deleted: Option<bool>, // Include soft-deleted records
}

/// DTO for staff response (read operations)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StaffResponseDto {
    pub id: Id,
    pub full_name: String,
    pub employee_id: String,
    pub position: String,
    pub department: String,
    pub phone: String,
    pub email: String,
    pub employment_status: EmploymentStatus,
    pub hire_date: Date,
    pub termination_date: Option<Date>,
    pub work_schedule: WorkSchedule,
    pub compensation: Option<Decimal>,
    pub emergency_contact_name: Option<String>,
    pub emergency_contact_phone: Option<String>,
    pub notes: Option<String>,
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
    pub deleted_at: Option<DateTimeWithTimeZone>,
    pub has_user_account: bool, // Indicates if staff has app access
}

/// DTO for staff list with pagination
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StaffListDto {
    pub items: Vec<StaffResponseDto>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
}

/// DTO for terminating a staff member
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerminateStaffDto {
    pub termination_date: Date,
    pub notes: Option<String>,
}

impl From<super::Model> for StaffResponseDto {
    fn from(model: super::Model) -> Self {
        Self {
            id: model.id,
            full_name: model.full_name,
            employee_id: model.employee_id,
            position: model.position,
            department: model.department,
            phone: model.phone,
            email: model.email,
            employment_status: model.employment_status,
            hire_date: model.hire_date,
            termination_date: model.termination_date,
            work_schedule: model.work_schedule,
            compensation: model.compensation,
            emergency_contact_name: model.emergency_contact_name,
            emergency_contact_phone: model.emergency_contact_phone,
            notes: model.notes,
            created_at: model.created_at,
            updated_at: model.updated_at,
            deleted_at: model.deleted_at,
            has_user_account: false, // Will be set by service layer
        }
    }
}
