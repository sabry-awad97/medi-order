use crate::id::Id;
use crate::user::UserStatus;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// DTO for creating a new user (granting app access to staff)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateUserDto {
    pub staff_id: Id,
    pub username: String,
    pub email: String,
    pub password: String, // Plain password, will be hashed by service
    pub first_name: String,
    pub last_name: String,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    pub npi_number: Option<String>,
    pub supervisor_id: Option<Id>,
    pub role_id: Id,
    pub status: UserStatus,
    pub is_active: bool,
    pub created_by: Option<Id>,
    pub updated_by: Option<Id>,
}

/// DTO for updating an existing user
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateUserDto {
    pub username: Option<String>,
    pub email: Option<String>,
    pub password: Option<String>, // Plain password, will be hashed by service
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    pub npi_number: Option<String>,
    pub supervisor_id: Option<Id>,
    pub role_id: Option<Id>,
    pub status: Option<UserStatus>,
    pub is_active: Option<bool>,
    pub updated_by: Option<Id>,
}

/// DTO for deleting (soft delete) a user
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeleteUserDto {
    pub deleted_by: Option<Id>,
}

/// DTO for user query filters
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct UserQueryDto {
    pub id: Option<Id>,
    pub staff_id: Option<Id>,
    pub username: Option<String>,
    pub email: Option<String>,
    pub role_id: Option<Id>,
    pub status: Option<UserStatus>,
    pub is_active: Option<bool>,
    pub supervisor_id: Option<Id>,
    pub include_deleted: Option<bool>, // Include soft-deleted records
}

/// DTO for user response (read operations) - excludes password hash
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserResponseDto {
    pub id: Id,
    pub staff_id: Id,
    pub username: String,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    pub npi_number: Option<String>,
    pub supervisor_id: Option<Id>,
    pub role_id: Id,
    pub status: UserStatus,
    pub is_active: bool,
    pub last_login_at: Option<DateTimeWithTimeZone>,
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
    pub deleted_at: Option<DateTimeWithTimeZone>,
}

/// DTO for user with staff information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserWithStaffDto {
    pub id: Id,
    pub staff_id: Id,
    pub username: String,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    pub npi_number: Option<String>,
    pub supervisor_id: Option<Id>,
    pub role_id: Id,
    pub status: UserStatus,
    pub is_active: bool,
    pub last_login_at: Option<DateTimeWithTimeZone>,
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
    // Staff information
    pub staff_full_name: String,
    pub staff_employee_id: String,
    pub staff_position: String,
    pub staff_department: String,
    pub staff_email: String,
    pub staff_phone: String,
    pub staff_employment_status: String,
}

/// DTO for user list with pagination
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserListDto {
    pub items: Vec<UserResponseDto>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
}

/// DTO for user login
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginDto {
    pub username: String,
    pub password: String,
}

/// DTO for user login response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginResponseDto {
    pub user: UserWithStaffDto,
    pub token: Option<String>, // For future JWT implementation
}

/// DTO for changing password
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChangePasswordDto {
    pub current_password: String,
    pub new_password: String,
}

/// DTO for resetting password (admin operation)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResetPasswordDto {
    pub new_password: String,
}

impl From<super::Model> for UserResponseDto {
    fn from(model: super::Model) -> Self {
        Self {
            id: model.id,
            staff_id: model.staff_id,
            username: model.username,
            email: model.email,
            first_name: model.first_name,
            last_name: model.last_name,
            display_name: model.display_name,
            avatar_url: model.avatar_url,
            npi_number: model.npi_number,
            supervisor_id: model.supervisor_id,
            role_id: model.role_id,
            status: model.status,
            is_active: model.is_active,
            last_login_at: model.last_login_at,
            created_at: model.created_at,
            updated_at: model.updated_at,
            deleted_at: model.deleted_at,
        }
    }
}
