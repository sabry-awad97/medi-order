use super::super::id::Id;
use chrono::{DateTime, FixedOffset};
use serde::{Deserialize, Serialize};

/// DTO for session token (used in validation/logout)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionToken {
    pub token: String,
}

/// DTO for creating a new session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSession {
    pub user_id: Id,
    pub token: String,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub expires_at: DateTime<FixedOffset>,
}

/// DTO for session response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionResponse {
    pub id: Id,
    pub user_id: Id,
    pub token: String,
    pub expires_at: DateTime<FixedOffset>,
    pub last_activity_at: DateTime<FixedOffset>,
    pub created_at: DateTime<FixedOffset>,
}

impl From<super::Model> for SessionResponse {
    fn from(model: super::Model) -> Self {
        Self {
            id: model.id,
            user_id: model.user_id,
            token: model.token,
            expires_at: model.expires_at,
            last_activity_at: model.last_activity_at,
            created_at: model.created_at,
        }
    }
}
