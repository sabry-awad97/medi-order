use super::Model;
use crate::id::Id;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;

// ============================================================================
// Create DTOs
// ============================================================================

/// DTO for creating/updating a setting
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SetSettingDto {
    pub key: String,
    pub value: JsonValue,
    pub category: Option<String>,
    pub description: Option<String>,
    pub updated_by: Option<Id>,
}

/// DTO for bulk setting operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SetMultipleSettingsDto {
    pub settings: Vec<SetSettingDto>,
}

// ============================================================================
// Query DTOs
// ============================================================================

/// DTO for querying settings
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct SettingQueryDto {
    pub key: Option<String>,
    pub category: Option<String>,
    pub search: Option<String>,
}

// ============================================================================
// Response DTOs
// ============================================================================

/// DTO for setting response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SettingResponseDto {
    pub id: Id,
    pub key: String,
    pub value: JsonValue,
    pub category: Option<String>,
    pub description: Option<String>,
    pub updated_by: Option<Id>,
    pub created_at: String,
    pub updated_at: String,
}

impl From<Model> for SettingResponseDto {
    fn from(model: Model) -> Self {
        Self {
            id: model.id,
            key: model.key,
            value: model.value,
            category: model.category,
            description: model.description,
            updated_by: model.updated_by,
            created_at: model.created_at.to_string(),
            updated_at: model.updated_at.to_string(),
        }
    }
}

// ============================================================================
// Typed Value DTOs (for convenience)
// ============================================================================

/// DTO for typed string value
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StringValueDto {
    pub value: String,
}

/// DTO for typed boolean value
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BoolValueDto {
    pub value: bool,
}

/// DTO for typed number value
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NumberValueDto {
    pub value: f64,
}
