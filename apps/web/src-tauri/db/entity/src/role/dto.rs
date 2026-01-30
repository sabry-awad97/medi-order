use crate::id::Id;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;

/// DTO for creating a new role
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateRoleDto {
    pub name: String,
    pub display_name: String,
    pub description: Option<String>,
    pub level: i32,
    pub permissions: JsonValue,
}

/// DTO for updating an existing role
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateRoleDto {
    pub name: Option<String>,
    pub display_name: Option<String>,
    pub description: Option<String>,
    pub level: Option<i32>,
    pub is_active: Option<bool>,
    pub permissions: Option<JsonValue>,
}

/// DTO for role query filters
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct RoleQueryDto {
    pub id: Option<Id>,
    pub name: Option<String>,
    pub is_active: Option<bool>,
    pub is_system: Option<bool>,
    pub min_level: Option<i32>,
    pub max_level: Option<i32>,
}

/// DTO for role response (read operations)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoleResponseDto {
    pub id: Id,
    pub name: String,
    pub display_name: String,
    pub description: Option<String>,
    pub level: i32,
    pub is_system: bool,
    pub is_active: bool,
    pub permissions: JsonValue,
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
}

/// DTO for role list with pagination
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoleListDto {
    pub items: Vec<RoleResponseDto>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
}

/// DTO for role with user count
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoleWithStatsDto {
    pub id: Id,
    pub name: String,
    pub display_name: String,
    pub description: Option<String>,
    pub level: i32,
    pub is_system: bool,
    pub is_active: bool,
    pub permissions: JsonValue,
    pub user_count: u64,
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
}

impl From<super::Model> for RoleResponseDto {
    fn from(model: super::Model) -> Self {
        Self {
            id: model.id,
            name: model.name,
            display_name: model.display_name,
            description: model.description,
            level: model.level,
            is_system: model.is_system,
            is_active: model.is_active,
            permissions: model.permissions,
            created_at: model.created_at,
            updated_at: model.updated_at,
        }
    }
}
