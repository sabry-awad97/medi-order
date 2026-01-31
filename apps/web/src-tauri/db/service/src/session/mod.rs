use chrono::{Duration, Utc};
use db_entity::{
    id::Id,
    session::{self, dto::*},
};
use sea_orm::*;
use std::sync::Arc;

use crate::error::{ServiceError, ServiceResult};

/// Session service for managing user sessions
/// Handles session creation, validation, and cleanup
pub struct SessionService {
    db: Arc<DatabaseConnection>,
}

impl SessionService {
    /// Create a new session service
    pub fn new(db: Arc<DatabaseConnection>) -> Self {
        Self { db }
    }

    /// Create a new session for a user
    /// Default session duration: 8 hours
    /// Default idle timeout: 30 minutes
    pub async fn create_session(
        &self,
        user_id: Id,
        ip_address: Option<String>,
        user_agent: Option<String>,
    ) -> ServiceResult<SessionResponse> {
        // Generate a secure random token
        let token = Self::generate_token();

        // Set expiration to 8 hours from now
        let expires_at = Utc::now() + Duration::hours(8);

        let session = session::ActiveModel {
            id: Set(Id::new()),
            user_id: Set(user_id),
            token: Set(token),
            ip_address: Set(ip_address),
            user_agent: Set(user_agent),
            expires_at: Set(expires_at.into()),
            last_activity_at: Set(Utc::now().into()),
            created_at: Set(Utc::now().into()),
        };

        let session = session.insert(&*self.db).await?;

        tracing::info!("Created session for user: {}", user_id);

        Ok(SessionResponse::from(session))
    }

    /// Validate a session token and return the session if valid
    pub async fn validate_session(&self, token: &str) -> ServiceResult<SessionResponse> {
        let session = session::Entity::find()
            .filter(session::Column::Token.eq(token))
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::Unauthorized("Invalid session token".to_string()))?;

        // Check if session is expired
        let now = Utc::now();
        if session.expires_at < now {
            // Delete expired session
            self.delete_session(&session.token).await?;
            return Err(ServiceError::Unauthorized("Session expired".to_string()));
        }

        // Check idle timeout (30 minutes)
        let idle_timeout = Duration::minutes(30);
        if session.last_activity_at + idle_timeout < now {
            // Delete idle session
            self.delete_session(&session.token).await?;
            return Err(ServiceError::Unauthorized(
                "Session expired due to inactivity".to_string(),
            ));
        }

        // Update last activity
        let mut session: session::ActiveModel = session.into();
        session.last_activity_at = Set(now.into());
        let session = session.update(&*self.db).await?;

        Ok(SessionResponse::from(session))
    }

    /// Get session by token
    pub async fn get_session(&self, token: &str) -> ServiceResult<SessionResponse> {
        let session = session::Entity::find()
            .filter(session::Column::Token.eq(token))
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::NotFound("Session not found".to_string()))?;

        Ok(SessionResponse::from(session))
    }

    /// Delete a session (logout)
    pub async fn delete_session(&self, token: &str) -> ServiceResult<()> {
        session::Entity::delete_many()
            .filter(session::Column::Token.eq(token))
            .exec(&*self.db)
            .await?;

        tracing::info!("Deleted session");

        Ok(())
    }

    /// Delete all sessions for a user
    pub async fn delete_user_sessions(&self, user_id: Id) -> ServiceResult<u64> {
        let result = session::Entity::delete_many()
            .filter(session::Column::UserId.eq(user_id))
            .exec(&*self.db)
            .await?;

        tracing::info!(
            "Deleted {} sessions for user: {}",
            result.rows_affected,
            user_id
        );

        Ok(result.rows_affected)
    }

    /// Clean up expired sessions (should be run periodically)
    pub async fn cleanup_expired_sessions(&self) -> ServiceResult<u64> {
        let now = Utc::now();

        let result = session::Entity::delete_many()
            .filter(session::Column::ExpiresAt.lt(now))
            .exec(&*self.db)
            .await?;

        if result.rows_affected > 0 {
            tracing::info!("Cleaned up {} expired sessions", result.rows_affected);
        }

        Ok(result.rows_affected)
    }

    /// Get all active sessions for a user
    pub async fn get_user_sessions(&self, user_id: Id) -> ServiceResult<Vec<SessionResponse>> {
        let now = Utc::now();

        let sessions = session::Entity::find()
            .filter(session::Column::UserId.eq(user_id))
            .filter(session::Column::ExpiresAt.gt(now))
            .all(&*self.db)
            .await?;

        Ok(sessions.into_iter().map(SessionResponse::from).collect())
    }

    /// Generate a secure random token
    fn generate_token() -> String {
        use rand::Rng;
        const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const TOKEN_LEN: usize = 64;

        let mut rng = rand::rng();
        (0..TOKEN_LEN)
            .map(|_| {
                let idx = rng.random_range(0..CHARSET.len());
                CHARSET[idx] as char
            })
            .collect()
    }
}
