use sea_orm::DbErr;
use thiserror::Error;

/// Custom error type for the service layer
#[derive(Error, Debug)]
pub enum ServiceError {
    /// Database connection error
    #[error("Database error: {0}")]
    Database(#[from] DbErr),
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
