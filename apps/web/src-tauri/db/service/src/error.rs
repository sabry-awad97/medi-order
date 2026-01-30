use sea_orm::DbErr;
use thiserror::Error;

/// Custom error type for the service layer
#[derive(Error, Debug)]
pub enum ServiceError {
    /// Database connection error
    #[error("Database error: {0}")]
    Database(#[from] DbErr),

    /// Resource not found
    #[error("Not found: {0}")]
    NotFound(String),

    /// Conflict (duplicate resource)
    #[error("Conflict: {0}")]
    Conflict(String),

    /// Bad request (validation error)
    #[error("Bad request: {0}")]
    BadRequest(String),

    /// Unauthorized access
    #[error("Unauthorized: {0}")]
    Unauthorized(String),

    /// Forbidden access
    #[error("Forbidden: {0}")]
    Forbidden(String),

    /// Internal server error
    #[error("Internal error: {0}")]
    Internal(String),
}

impl serde::Serialize for ServiceError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

pub type ServiceResult<T> = Result<T, ServiceError>;
